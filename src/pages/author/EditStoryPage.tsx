import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";

type StoryRow = {
  id: string;
  title: string | null;
  description: string | null;
  author: string | null;
  slug: string | null;
  coverImage: string | null;
  status: string | null;
  story_type: string | null;
  genres: string | null; // DB của bạn là text
};

export function EditStoryPage() {
  const { storyId } = useParams<{ storyId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [story, setStory] = useState<StoryRow | null>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("Ongoing");
  const [storyType, setStoryType] = useState("original");
  const [genresText, setGenresText] = useState(""); // nhập dạng: "tiên hiệp, đô thị, ..."

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setMsg(null);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }
      if (!storyId) return;

      // Chỉ fetch truyện của chính user
      const { data, error } = await supabase
        .from("stories")
        .select("id, title, description, author, slug, coverImage, status, story_type, genres")
        .eq("id", storyId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!alive) return;

      if (error || !data) {
        console.error(error);
        setMsg("Không tìm thấy truyện hoặc bạn không có quyền sửa truyện này.");
        setStory(null);
        setLoading(false);
        return;
      }

      const s = data as any as StoryRow;
      setStory(s);

      setTitle(s.title ?? "");
      setDescription(s.description ?? "");
      setAuthor(s.author ?? "");
      setCoverImage(s.coverImage ?? "");
      setStatus(s.status ?? "Ongoing");
      setStoryType(s.story_type ?? "original");
      
      const g: any = (s as any).genres;
      setGenresText(Array.isArray(g) ? g.join(", ") : (g ?? ""));


      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [storyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story) return;

    setSaving(true);
    setMsg(null);

    // ⚠️ Khuyến nghị: KHÔNG đổi slug khi sửa title để tránh hỏng link
    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      coverImage: coverImage.trim() || null,
      status,
      story_type: storyType,
      genres: genresText.trim() || null,
      lastUpdated: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("stories")
      .update(payload)
      .eq("id", story.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMsg("Lưu thất bại. Thử lại sau.");
      return;
    }

    setMsg("✅ Đã lưu thay đổi!");
    // quay lại khu tác giả
    setTimeout(() => {
      window.location.href = "/author";
    }, 700);
  };

  return (
    <AuthorLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Sửa truyện</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Đang tải…</p>
            ) : !story ? (
              <p className="text-muted-foreground">{msg ?? "Không có dữ liệu."}</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium">Văn án (description)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tác giả (hiển thị)</label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium">Ảnh bìa (URL)</label>
                  <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <select
                      className="w-full border rounded h-10 px-3"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Loại truyện</label>
                    <select
                      className="w-full border rounded h-10 px-3"
                      value={storyType}
                      onChange={(e) => setStoryType(e.target.value)}
                    >
                      <option value="original">original</option>
                      <option value="translated">translated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Thể loại (genres)</label>
                  <Input
                    value={genresText}
                    onChange={(e) => setGenresText(e.target.value)}
                    placeholder='Ví dụ: "tiên hiệp, đô thị, ngôn tình"'
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {genresText
                      .split(",")
                      .map((g) => g.trim())
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                  </div>
                </div>

                {msg && <div className="text-sm">{msg}</div>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Huỷ
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthorLayout>
  );
}
