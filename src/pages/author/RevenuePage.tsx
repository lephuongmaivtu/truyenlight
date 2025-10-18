import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";

type StoryRevenue = {
  story_id: string;
  title: string;
  views: number;
  revenue: number;
  last_update: string;
};

export default function RevenuePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [revenues, setRevenues] = useState<StoryRevenue[]>([]);
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

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

  // 🧩 Fetch dữ liệu doanh thu
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      // giả sử m đã có view "author_story_revenue"
      // chứa: story_id, author_id, title, views, revenue, last_update
      const { data, error } = await supabase
        .from("author_story_revenue")
        .select("*")
        .eq("author_id", userId)
        .order("revenue", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // lọc theo thời gian
      const now = new Date();
      const filtered = data.filter((r) => {
        const t = new Date(r.last_update);
        if (filter === "day") {
          return t.toDateString() === now.toDateString();
        } else if (filter === "week") {
          const diff = (now.getTime() - t.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        } else if (filter === "month") {
          return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
        } else return true;
      });

      setRevenues(filtered);
      setTotal(filtered.reduce((sum, r) => sum + (r.revenue ?? 0), 0));
      setLoading(false);
    })();
  }, [userId, filter]);

  return (
    <AuthorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">💰 Doanh thu của tôi</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Đang tải...</p>
            ) : (
              <div className="text-3xl font-bold text-primary">
                {total.toLocaleString("vi-VN")} ₫
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danh sách truyện */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {revenues.map((r) => (
            <Card key={r.story_id}>
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Lượt xem:</span>
                  <span>{(r.views ?? 0).toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Doanh thu:</span>
                  <span>{Math.round(r.revenue ?? 0).toLocaleString("vi-VN")} ₫</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Cập nhật: {new Date(r.last_update).toLocaleDateString("vi-VN")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuthorLayout>
  );
}
