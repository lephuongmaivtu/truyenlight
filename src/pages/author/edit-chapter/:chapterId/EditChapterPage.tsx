import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import AuthorLayout from "./AuthorLayout";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function EditChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string>("");
  const [chapterNumber, setChapterNumber] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      if (!chapterId) return;

      if (alive) setUserId(data.user.id);

      const { data: ch, error } = await supabase
        .from("chapters")
        .select("id, story_id, title, content, number, user_id")
        .eq("id", chapterId)
        .single();

      if (error || !ch) {
        console.error(error);
        setMsg("Không tìm thấy chapter.");
        setLoading(false);
        return;
      }

      // chặn sửa của người khác
      if (ch.user_id !== data.user.id) {
        setMsg("Bạn không có quyền sửa chapter này.");
        setLoading(false);
        return;
      }

      setStoryId(ch.story_id);
      setTitle(ch.title ?? "");
      setContent(ch.content ?? "");
      setChapterNumber(ch.number ?? "");
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !chapterId || !title.trim() || !content.trim() || !chapterNumber) {
      setMsg("Vui lòng nhập đầy đủ thông tin (bao gồm số chương).");
      return;
    }

    setSubmitting(true);
    setMsg(null);

    const slug = slugify(title);

    const { error } = await supabase
      .from("chapters")
      .update({
        title,
        slug,
        content,
        number: Number(chapterNumber),
        // updated_at: new Date().toISOString(), // nếu bạn có cột updated_at thì bật
      })
      .eq("id", chapterId)
      .eq("user_id", userId);

    setSubmitting(false);

    if (error) {
      console.error(error);
      setMsg("Cập nhật thất bại, thử lại sau.");
      return;
    }

    setMsg("✅ Cập nhật chapter thành công!");
    setTimeout(() => {
      window.location.href = `/author`; // hoặc quay về trang truyện của tác giả
    }, 700);
  };

  if (loading) {
    return (
      <AuthorLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <p className="text-muted-foreground">Đang tải chapter…</p>
        </div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Sửa Chapter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Số chương</label>
                <Input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => {
                    const v = e.target.value;
                    setChapterNumber(v === "" ? "" : Number(v));
                  }}
                  placeholder="Ví dụ: 1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tiêu đề chương</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Chương 1: ..."
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Slug: {title ? slugify(title) : "(tự tạo)"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Nội dung</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                />
              </div>

              {msg && <div className="text-sm">{msg}</div>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Huỷ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthorLayout>
  );
}
