import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthorLayout from "./AuthorLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function RevenuePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<{ all: number; month: number }>({ all: 0, month: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  // 🧠 Lấy user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(data.user.id);
    });
  }, []);

  // 🧩 Fetch doanh thu theo truyện
  // 🧩 Fetch doanh thu theo tháng và tổng
useEffect(() => {
  if (!userId) return;
  (async () => {
    setLoading(true);

    // 1️⃣ Lấy doanh thu từng truyện trong tháng hiện tại
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("story_views_per_month")
      .select(`
        story_id,
        monthly_views,
        monthly_revenue,
        view_month,
        stories ( title )
      `)
      .eq("author_id", userId)
      .gte("view_month", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()) // đầu tháng
      .lte("view_month", new Date().toISOString()) // đến nay
      .order("monthly_revenue", { ascending: false });

    if (monthlyError) {
      console.error("Lỗi fetch doanh thu:", monthlyError);
      setLoading(false);
      return;
    }

    // 2️⃣ Tính tổng doanh thu tháng & tổng toàn thời gian
    const { data: allData } = await supabase
      .from("story_views_per_month")
      .select("monthly_revenue")
      .eq("author_id", userId);

    const totalRevenue = (allData ?? []).reduce(
      (sum, r) => sum + (r.monthly_revenue ?? 0),
      0
    );
    const currentMonthRevenue = (monthlyData ?? []).reduce(
      (sum, r) => sum + (r.monthly_revenue ?? 0),
      0
    );

    setTotal({
      all: totalRevenue,
      month: currentMonthRevenue,
    });
    setRevenues(monthlyData ?? []);
    setLoading(false);
  })();
}, [userId]);


  // 📊 Fetch dữ liệu cho biểu đồ doanh thu theo tháng
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("story_views_per_month")
        .select("month, total_views")
        .eq("author_id", userId)
        .order("month", { ascending: true });

      if (!error && data) {
        const transformed = data.map((d: any) => ({
          month: d.month,
          revenue: Math.round((d.total_views / 1000) * 5000), // ví dụ tính doanh thu 5k/1000 view
        }));
        setChartData(transformed);
      }
    })();
  }, [userId]);

  return (
    <AuthorLayout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* Tổng doanh thu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Tổng doanh thu (từ trước đến nay)</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {total.all.toLocaleString("vi-VN")} ₫
              </div>
            </CardContent>
          </Card>
        
          <Card>
            <CardHeader><CardTitle>Doanh thu tháng này</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {total.month.toLocaleString("vi-VN")} ₫
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Biểu đồ doanh thu theo tháng */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("vi-VN")} ₫`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Chưa có dữ liệu doanh thu theo tháng.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Danh sách doanh thu từng truyện */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Doanh thu từng truyện (tháng này)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenues.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                Chưa có dữ liệu doanh thu tháng này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {revenues.map((r) => (
                  <Card key={r.story_id}>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-1">
                        {r.stories?.title || "Không rõ tên truyện"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Lượt xem:</span>
                        <span>{(r.monthly_views ?? 0).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Doanh thu:</span>
                        <span>{(r.monthly_revenue ?? 0).toLocaleString("vi-VN")} ₫</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(r.view_month).toLocaleDateString("vi-VN")}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthorLayout>
  );
}
