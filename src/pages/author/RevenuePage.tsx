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
// 🧩 Fetch dữ liệu doanh thu từ view
useEffect(() => {
  if (!userId) return;
  (async () => {
    setLoading(true);

    // Lấy doanh thu tháng hiện tại
    const { data, error } = await supabase
      .from("author_revenue_by_story") // 👈 view này mới có story_title, first_day, last_day
      .select("*")
      .eq("author_id", userId)
      .order("revenue", { ascending: false });
    const monthlyTotal = (data ?? []).reduce((sum, r) => sum + (r.revenue ?? 0), 0);
      setRevenues(data ?? []);
      setTotal({ all: total.all, month: monthlyTotal });



    if (error) {
      console.error("Lỗi fetch:", error);
      setLoading(false);
      return;
    }

    // Tính tổng doanh thu tháng này & all-time (nếu cần)
    const monthlyTotal = (data ?? []).reduce((sum, r) => sum + (r.monthly_revenue ?? 0), 0);

    setRevenues(data ?? []);
    setTotal({ all: total.all, month: monthlyTotal }); // total.all sẽ được cập nhật riêng từ view tổng
    setLoading(false);
  })();
}, [userId]);



  // 📊 Fetch dữ liệu cho biểu đồ doanh thu theo tháng
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("author_monthly_revenue_view")
        .select("month_start, total_revenue")
        .eq("author_id", userId)
        .order("month_start", { ascending: true });
      
      if (!error && data) {
        const transformed = data.map((d) => ({
          month: new Date(d.month_start).toLocaleDateString("vi-VN", { month: "short", year: "numeric" }),
          revenue: d.total_revenue,
        }));
        setChartData(transformed);
      }
    })();
  }, [userId]);

  const { data: totalData, error: totalError } = await supabase
    .from("author_total_revenue")
    .select("total_revenue")
    .eq("author_id", userId)
    .single();
  
  if (!totalError && totalData) {
    setTotal((prev) => ({ ...prev, all: totalData.total_revenue }));
  }

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
                        {r.story_title || r.title || "Không rõ tên truyện"}
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
                          📅 Từ {new Date(r.first_day).toLocaleDateString("vi-VN")}  
                          đến {new Date(r.last_day).toLocaleDateString("vi-VN")}
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
