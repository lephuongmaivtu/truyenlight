import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";

type ChapterRow = {
  id: string;
  title: string;
  number: number | null;
  created_at: string | null;
  user_id: string | null;
};

export function AuthorStoryChaptersPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

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

      const { data, error } = await supabase
        .from("chapters")
        .select("id, title, number, created_at, user_id")
        .eq("story_id", storyId)
        .eq("user_id", auth.user.id) // chỉ lấy chapter của chính tác giả
        .order("number", { ascending: true })
        .order("created_at", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error(error);
        setMsg("Không tải được danh sách chapter.");
        setChapters([]);
      } else {
        setChapters((data ?? []) as any);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [storyId]);

  return (
    <AuthorLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quản lý Chapters</CardTitle>

            {/* nút đăng chapter mới */}
            <Link to="/author/upload-chapter">
              <Button size="sm">+ Đăng chapter</Button>
            </Link>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Đang tải…</p>
            ) : (
              <div className="space-y-2">
                {msg && <div className="text-sm">{msg}</div>}

                {chapters.length === 0 ? (
                  <p className="text-muted-foreground">Chưa có chapter nào.</p>
                ) : (
                  chapters.map((ch, idx) => (
                    <div key={ch.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {ch.number ? `Chương ${ch.number}: ` : ""}
                            {ch.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {ch.created_at ? new Date(ch.created_at).toLocaleDateString() : "-"}
                          </div>
                        </div>

                        {/* NÚT SỬA -> trỏ vào EditChapterPage của bạn */}
                        <Link to={`/author/edit-chapter/${ch.id}`}>
                          <Button variant="outline" size="sm">Sửa</Button>
                        </Link>
                      </div>
                      {idx < chapters.length - 1 && <Separator />}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthorLayout>
  );
}
