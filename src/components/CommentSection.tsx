import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type CommentRow = {
  id: string;
  chapter_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  // nếu có bảng profiles thì thêm field join ở đây
};

export function CommentSection({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // lấy user hiện tại
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  // load comments
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: true });
      if (!error && data) setComments(data as CommentRow[]);
    }
    if (chapterId) load();
  }, [chapterId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newComment.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .insert([{ chapter_id: chapterId, user_id: userId, content: newComment.trim() }])
      .select()
      .single();

    setLoading(false);
    if (!error && data) {
      setComments((prev) => [...prev, data as CommentRow]);
      setNewComment("");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 border-t mt-8">
      <h3 className="text-lg font-bold mb-4">Bình luận</h3>

      {userId ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            placeholder="Viết bình luận..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          Đăng nhập để bình luận.
        </p>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="p-3 rounded border">
            <div className="text-sm text-muted-foreground">
              {new Date(c.created_at).toLocaleString("vi-VN")}
            </div>
            <div className="text-[15px]">{c.content}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
        )}
      </div>
    </div>
  );
}
