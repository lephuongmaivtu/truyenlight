import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

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
  const [genres, setGenres] = useState(""); // nhập bằng dấu phẩy
  const [status, setStatus] = useState<"Ongoing" | "Completed" | "Hiatus">("Ongoing");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!title.trim()) {
      setMsg("Vui lòng nhập tên truyện");
      return;
    }
    setSubmitting(true);
    setMsg(null);

    const slug = slugify(title);
    const genreArr = genres
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    const { data, error } = await supabase.from("stories").insert([
      {
        title,
        slug,
        author: author || "Đang cập nhật",
        description,
        genres: genreArr,        // Supabase sẽ lưu kiểu text[] hoặc jsonb tùy schema
        status,
        coverImage: coverUrl || null,
        user_id: userId,
        views: 0,
      },
    ]).select("id, slug").single();

    setSubmitting(false);

    if (error) {
      console.error(error);
      setMsg("Đăng truyện thất bại, thử lại sau.");
      return;
    }

    setMsg("✅ Đăng truyện thành công!");
    // chuyển về dashboard tác giả
    setTimeout(() => {
      window.location.href = "/author";
    }, 800);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Đăng Truyện Mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên truyện</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên truyện" />
              <div className="text-xs text-muted-foreground mt-1">Slug: {title ? slugify(title) : "(tự tạo từ tên)"}</div>
            </div>

            <div>
              <label className="text-sm font-medium">Tác giả</label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Tên tác giả (có thể để trống)" />
            </div>

            <div>
              <label className="text-sm font-medium">Thể loại (phân cách bằng dấu phẩy)</label>
              <Input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Ngôn tình, Hiện đại, ..."/>
              <div className="flex gap-2 mt-2">
                {genres.split(",").map((g) => g.trim()).filter(Boolean).slice(0,6).map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <div className="flex gap-2">
                {(["Ongoing","Completed","Hiatus"] as const).map(s => (
                  <Button key={s} type="button" variant={status===s?"default":"outline"} onClick={()=>setStatus(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Ảnh bìa (URL)</label>
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
              {coverUrl && (
                <img src={coverUrl} alt="cover" className="mt-2 w-40 h-56 object-cover rounded border" />
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Giới thiệu / Văn án</label>
              <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={6} placeholder="Mô tả nội dung truyện..." />
            </div>

            {msg && <div className="text-sm">{msg}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Đang đăng..." : "Đăng truyện"}</Button>
              <Button type="button" variant="outline" onClick={()=>window.history.back()}>Huỷ</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
