import React, { useEffect, useState } from "react";
import { fetchComments, addComment } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useUser } from "@supabase/auth-helpers-react";

export function CommentSection({ chapterId }: { chapterId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const user = useUser();

  useEffect(() => {
    async function loadComments() {
      const data = await fetchComments(chapterId);
      setComments(data);
    }
    loadComments();
  }, [chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const added = await addComment(chapterId, user.id, newComment);
    if (added) {
      setComments([...comments, added]);
      setNewComment("");
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-bold mb-4">Bình luận</h3>
      
      {/* Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Viết bình luận..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button type="submit">Gửi</Button>
        </form>
      ) : (
        <p className="text-muted-foreground">Đăng nhập để bình luận</p>
      )}

      {/* List */}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="p-3 border rounded">
            <p className="font-semibold">{c.profiles?.username || "User"}</p>
            <p className="text-sm">{c.content}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
