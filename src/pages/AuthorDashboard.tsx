import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { PenSquare, PlusCircle } from "lucide-react";

export function AuthorDashboard() {
  const [stories, setStories] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserStories() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(auth.user.id);

      const { data, error } = await supabase
        .from("stories")
        .select("id, title, slug, coverImage, status, story_type, views, genres")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setStories(data);
      setLoading(false);
    }

    fetchUserStories();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Đang tải truyện của bạn...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📚 Truyện của tôi</h1>
        <Link to="/author/upload-story">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Đăng truyện mới
          </Button>
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          Bạn chưa đăng truyện nào.  
          <br />
          <Link to="/author/upload-story" className="text-primary underline">
            Đăng truyện đầu tiên ngay →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {story.coverImage ? (
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-52 object-cover"
                />
              ) : (
                <div className="w-full h-52 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Không có ảnh bìa
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-1">{story.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {story.genres?.slice(0, 3).map((g: string) => (
                    <Badge key={g} variant="secondary">
                      {g}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {story.story_type === "translated" ? "Truyện dịch" : "Sáng tác"} ·{" "}
                  {story.status === "Ongoing"
                    ? "Đang ra"
                    : story.status === "Completed"
                    ? "Hoàn thành"
                    : "Tạm ngưng"}
                </div>
                <div className="text-xs text-muted-foreground">
                  👁 {story.views || 0} lượt xem
                </div>

                <div className="pt-3">
                  <Link to={`/story/${story.slug}`}>
                    <Button size="sm" variant="outline" className="w-full flex items-center gap-2">
                      <PenSquare className="h-4 w-4" /> Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
