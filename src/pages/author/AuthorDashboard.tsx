import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // ✅ sửa ../ thành ../../
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"; // ✅
import { Badge } from "../../components/ui/badge"; // ✅
import { Button } from "../../components/ui/button"; // ✅ (nếu dùng)
import AuthorLayout from "./AuthorLayout"; // giữ nguyên
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  DollarSign,
  ListTodo,
  LogOut,
} from "lucide-react";


type MyStory = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  views: number | null;
  status: string | null;
  story_type: string | null;
  genres: string[] | null;
};

type TotalRevenueRow = {
  author_id: string;
  author_email: string | null;
  total_views: number | null;
  total_revenue: number | null;
};

export function AuthorDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [totals, setTotals] = useState<TotalRevenueRow | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Lấy user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // 🧩 Fetch data: truyện và doanh thu
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const [{ data: stories }, { data: totalRow }] = await Promise.all([
        supabase
          .from("stories")
          .select("id, title, slug, coverImage, views, status, story_type, genres")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("author_total_revenue")
          .select("*")
          .eq("author_id", userId)
          .maybeSingle(),


      ]);

      setMyStories(
        (stories ?? []).map((s: any) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          coverImage: s.coverImage || null,
          views: s.views ?? 0,
          status: s.status ?? "Ongoing",
          story_type: s.story_type ?? "original",
          genres: s.genres ?? [],
        }))
      );

      setTotals(
        totalRow ?? {
          author_id: userId,
          author_email: null,
          total_revenue: 0,
          total_views: 0,
        }
      );
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <AuthorLayout>
        <div className="text-muted-foreground py-10 text-center">
          Đang tải khu vực tác giả…
        </div>
      </AuthorLayout>
    );
  }

  return (
    <AuthorLayout>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Doanh thu (tổng)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {(totals?.total_revenue ?? 0).toLocaleString("vi-VN")} ₫
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tổng lượt xem</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {(totals?.total_views ?? 0).toLocaleString("vi-VN")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Truyện của tôi</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{myStories.length}</CardContent>
        </Card>
      </div>

      {/* Danh sách truyện */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Truyện của tôi</CardTitle>
        </CardHeader>
        <CardContent>
          {myStories.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              Bạn chưa đăng truyện nào.{" "}
              <Link to="/author/upload-story" className="text-primary underline">
                Đăng truyện ngay →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myStories.map((s) => (
                <Link
                  to={`/story/${s.slug}`}
                  key={s.id}
                  className="block border rounded-lg overflow-hidden hover:shadow-md transition-all bg-card"
                >
                  <div className="aspect-[3/4] bg-muted relative">
                    {s.coverImage ? (
                      <img
                        src={s.coverImage}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Không có ảnh bìa
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1 rounded-tr-md">
                      {s.story_type === "translated" ? "Truyện dịch" : "Sáng tác"}
                    </div>
                  </div>

                  <div className="p-3 space-y-1">
                    <div className="font-semibold line-clamp-1">{s.title}</div>

                    <div className="flex flex-wrap gap-1">
                      {s.genres?.slice(0, 3).map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>👁 {(s.views ?? 0).toLocaleString("vi-VN")}</span>
                      <Badge
                        variant={s.status === "Completed" ? "default" : "secondary"}
                      >
                        {s.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      💰{" "}
                      {Math.round(((s.views ?? 0) / 1000) * 5000).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AuthorLayout>
  );
}
