import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MessageCircle } from "lucide-react";

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
    .insert([
      {
        chapter_id: chapterId,
        user_id: userId,
        content: newComment.trim(),
      },
    ])
    .select()
    .single();

  setLoading(false);

  console.log("Insert comment result:", { data, error });

  if (error) {
    console.error("Insert comment error:", error);
    alert("Không gửi được bình luận: " + error.message);
    return;
  }

  if (data) {
    setComments((prev) => [...prev, data as CommentRow]);
    setNewComment("");
  }
}


   return (
    <div className="max-w-3xl mx-auto px-6 py-8 border-t mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-foreground" />
        <h3 className="text-xl font-semibold tracking-wide uppercase">
          Bình luận
        </h3>
      </div>

      {/* Box nhập bình luận */}
      {userId ? (
        <div className="flex gap-3 mb-6">
          {/* Avatar user hiện tại (chữ cái đầu) */}
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground/80">
            {(userId && userId[0].toUpperCase()) || "U"}
          </div>

          <form onSubmit={handleSubmit} className="flex-1">
            <textarea
              placeholder="Nội dung bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-transparent"
            />

            <div className="flex justify-end mt-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNewComment("")}
                className="text-muted-foreground"
              >
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading || !newComment.trim()}>
                {loading ? "Đang gửi..." : "Đăng"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          Đăng nhập để bình luận.
        </p>
      )}

      {/* Danh sách bình luận */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {/* Avatar người bình luận */}
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground/80 flex-shrink-0">
                {(c.user_id && c.user_id[0].toUpperCase()) || "U"}
              </div>

              <div className="flex-1 border-b border-border pb-3 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">Người đọc</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {c.content}
                </p>

                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  Trả lời
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

