import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function UploadStoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<"Ongoing" | "Completed" | "Hiatus">("Ongoing");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 🧠 Dữ liệu từ Supabase
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [storyType, setStoryType] = useState<"translated" | "original">("original");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });

    // fetch genres & groups
    (async () => {
      const { data: genresData } = await supabase.from("genres").select("id, name");
      const { data: groupsData } = await supabase.from("translation_groups").select("id, name").order("name");
      if (genresData) setGenres(genresData);
      if (groupsData) setGroups(groupsData);
    })();
  }, []);

  // ✅ Tick thể loại
  const toggleGenre = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genreName));
    } else if (selectedGenres.length < 5) {
      setSelectedGenres([...selectedGenres, genreName]);
    } else {
      alert("Chỉ được chọn tối đa 5 thể loại!");
    }
  };

  // ✅ Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!title.trim()) return setMsg("⚠️ Vui lòng nhập tên truyện");
    if (selectedGenres.length === 0) return setMsg("⚠️ Vui lòng chọn ít nhất 1 thể loại");

    setSubmitting(true);
    setMsg(null);

    // Nếu user nhập nhóm mới
    let group_id = selectedGroup;
    if (newGroupName.trim()) {
      const { data: newGroup, error: groupErr } = await supabase
        .from("translation_groups")
        .insert({ name: newGroupName.trim() })
        .select("id")
        .single();
      if (!groupErr && newGroup) group_id = newGroup.id;
    }

    const slug = slugify(title);

    const { error } = await supabase.from("stories").insert([
      {
        title,
        slug,
        author: author || "Đang cập nhật",
        description,
        genres: selectedGenres,
        status,
        coverImage: coverUrl || null,
        user_id: userId,
        story_type: storyType,
        group_id: group_id || null,
        views: 0,
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      setMsg("❌ Đăng truyện thất bại, thử lại sau.");
    } else {
      setMsg("✅ Đăng truyện thành công!");
      setTimeout(() => (window.location.href = "/author"), 1000);
    }
  };

  return (
    <AuthorLayout>
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Đăng Truyện Mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Tên truyện */}
            <div>
              <label className="text-sm font-medium">Tên truyện</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên truyện" />
              <div className="text-xs text-muted-foreground mt-1">
                Slug: {title ? slugify(title) : "(tự tạo từ tên)"}
              </div>
            </div>

            {/* Loại truyện */}
            <div>
              <label className="text-sm font-medium">Loại truyện</label>
              <div className="flex gap-3 mt-1">
                {[
                  { label: "Truyện dịch", value: "translated" },
                  { label: "Truyện sáng tác", value: "original" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={storyType === opt.value}
                      onChange={() => setStoryType(opt.value as any)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Nhóm dịch */}
            <div>
              <label className="text-sm font-medium">Nhóm dịch</label>
              <Select onValueChange={setSelectedGroup} value={selectedGroup}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nhóm dịch (hoặc nhập mới)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Hoặc nhập nhóm dịch mới..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Tác giả */}
            <div>
              <label className="text-sm font-medium">Tác giả</label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Tên tác giả (có thể để trống)" />
            </div>

            {/* Thể loại */}
            <div>
              <label className="text-sm font-medium">Thể loại (chọn tối đa 5)</label>
              <div className="flex flex-wrap gap-3 mt-2">
                {genres.map((g) => (
                  <label key={g.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(g.name)}
                      onChange={() => toggleGenre(g.name)}
                    />
                    <span className="text-sm">{g.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedGenres.map((g) => (
                  <Badge key={g}>{g}</Badge>
                ))}
              </div>
            </div>

            {/* Ảnh bìa */}
            <div>
              <label className="text-sm font-medium">Ảnh bìa (URL)</label>
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
              {coverUrl && (
                <img src={coverUrl} alt="cover" className="mt-2 w-40 h-56 object-cover rounded border" />
              )}
            </div>

            {/* Trạng thái */}
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <div className="flex gap-2">
                {(["Ongoing", "Completed", "Hiatus"] as const).map((s) => (
                  <Button key={s} type="button" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Giới thiệu */}
            <div>
              <label className="text-sm font-medium">Giới thiệu / Văn án</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Mô tả nội dung truyện..."
              />
            </div>

            {msg && <div className="text-sm mt-2">{msg}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang đăng..." : "Đăng truyện"}
              </Button>
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </AuthorLayout>
  );
}
