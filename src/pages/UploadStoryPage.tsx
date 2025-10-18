import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function UploadStoryPage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [group, setGroup] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !cover) {
      setMessage("Vui lòng nhập tên truyện và chọn ảnh bìa.");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Upload ảnh bìa lên bucket "covers"
      const fileExt = cover.name.split(".").pop();
      const filePath = `${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, cover);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("covers")
        .getPublicUrl(filePath);

      // 2️⃣ Lưu thông tin vào bảng "stories"
      const { error: insertError } = await supabase.from("stories").insert([
        {
          title,
          author,
          group_name: group,
          genre,
          description,
          cover_image: publicUrl.publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      setMessage("Đăng truyện thành công!");
      setTitle("");
      setAuthor("");
      setGroup("");
      setGenre("");
      setDescription("");
      setCover(null);
    } catch (err: any) {
      console.error(err);
      setMessage("Đăng truyện thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Đăng truyện mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Tên truyện"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Tác giả"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <Input
              placeholder="Nhóm dịch"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
            <Input
              placeholder="Thể loại"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
            <textarea
              placeholder="Mô tả"
              className="w-full border rounded p-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Đang đăng..." : "Đăng truyện"}
            </Button>
            {message && <p className="text-sm text-center mt-2">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
