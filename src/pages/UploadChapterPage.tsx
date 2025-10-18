import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type MyStory = { id: string; title: string; slug: string };

export function UploadChapterPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [stories, setStories] = useState<MyStory[]>([]);
  const [storyId, setStoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
      const { data: myStories } = await supabase
        .from("stories")
        .select("id, title, slug")
        .eq("user_id", data.user.id)
        .order("title", { ascending: true });
      setStories(myStories ?? []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !storyId || !title.trim() || !content.trim()) {
      setMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setSubmitting(true);
    setMsg(null);

    const slug = slugify(title);

    const { data, error } = await supabase.from("chapters").insert([
      {
        story_id: storyId,
        title,
        slug,
        content,
        user_id: userId,
      },
    ]).select("id, slug").single();

    setSubmitting(false);

    if (error) {
      console.error(error);
      setMsg("Đăng chapter thất bại, thử lại sau.");
      return;
    }

    setMsg("✅ Đăng chapter thành công!");
    // quay lại truyện
    setTimeout(async () => {
      const st = stories.find((s) => s.id === storyId);
      if (st) window.location.href = `/story/${st.slug}/${slug}`;
      else window.location.href = "/author";
    }, 800);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Đăng Chapter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chọn truyện</label>
              <select
                className="w-full border rounded h-10 px-3"
                value={storyId}
                onChange={(e) => setStoryId(e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {stories.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Tiêu đề chương</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chương 1: ..." />
              <div className="text-xs text-muted-foreground mt-1">Slug: {title ? slugify(title) : "(tự tạo)"}</div>
            </div>

            <div>
              <label className="text-sm font-medium">Nội dung</label>
              <Textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={12} placeholder="Dán nội dung chương tại đây..." />
            </div>

            {msg && <div className="text-sm">{msg}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Đang đăng..." : "Đăng chapter"}</Button>
              <Button type="button" variant="outline" onClick={()=>window.history.back()}>Huỷ</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
