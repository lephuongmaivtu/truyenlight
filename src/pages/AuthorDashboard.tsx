import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

type MyStory = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  views: number | null;
  status: string | null;
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const [{ data: stories }, { data: totalRow }] = await Promise.all([
        supabase
          .from("stories")
          .select("id, title, slug, coverImage, coverimage, views, status")
          .eq("user_id", userId)
          .order("title", { ascending: true }),
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
          coverImage: s.coverImage || s.coverimage || null,
          views: s.views ?? 0,
          status: s.status ?? "Ongoing",
        }))
      );
      setTotals(totalRow ?? { author_id: userId, author_email: null, total_revenue: 0, total_views: 0 });
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Đang tải khu vực tác giả…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Khu Vực Tác Giả</h1>
        <div className="flex gap-2">
          <Link to="/author/upload-story"><Button>+ Đăng truyện</Button></Link>
          <Link to="/author/upload-chapter"><Button variant="outline">+ Đăng chapter</Button></Link>
        </div>
      </div>

      {/* Cards tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Danh sách truyện của tôi */}
      <Card>
        <CardHeader><CardTitle>Truyện của tôi</CardTitle></CardHeader>
        <CardContent>
          {myStories.length === 0 ? (
            <div className="text-muted-foreground">
              Chưa có truyện nào. <Link to="/author/upload-story" className="underline">Đăng truyện ngay</Link>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myStories.map(s => (
                <Link to={`/story/${s.slug}`} key={s.id} className="block border rounded-lg overflow-hidden hover:shadow">
                  <div className="aspect-[3/4] bg-muted">
                    {s.coverImage && <img src={s.coverImage} className="w-full h-full object-cover" alt={s.title} />}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold line-clamp-1">{s.title}</div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>👁️ {(s.views ?? 0).toLocaleString("vi-VN")}</span>
                      <Badge variant={s.status === "Completed" ? "default" : "secondary"}>{s.status}</Badge>
                    </div>
                    {/* doanh thu từng truyện: views * 5000 / 1000 */}
                    <div className="text-sm mt-1">
                      Doanh thu: {Math.round(((s.views ?? 0) / 1000) * 5000).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
