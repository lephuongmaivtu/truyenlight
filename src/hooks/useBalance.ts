import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

export function useBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchBalance() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!ignore) {
        if (!error && data) setBalance(data.balance);
        else setBalance(0);
        setLoading(false);
      }
    }

    fetchBalance();

    // 🔥 Thêm đoạn này ngay dưới fetchBalance()
    const channel = supabase
      .channel("realtime:user_balances")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_balances" },
        (payload) => {
          // Khi có event UPDATE, cập nhật lại state
          if (payload.new?.balance !== undefined) {
            console.log("🔁 Balance changed:", payload.new.balance);
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    // Cleanup channel khi component unmount
    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    balance,
    loading,
    setBalance,
    refresh: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      if (data) setBalance(data.balance);
    },
  };
}
