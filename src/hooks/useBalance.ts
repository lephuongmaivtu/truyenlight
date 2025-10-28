import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

export function useBalance() {
  const [coin, setCoin] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("user_balance")
        .select("total_coin")
        .eq("user_id", user.id)
        .single();
      if (!ignore) {
        if (!error && data) setCoin(data.total_coin);
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  return { coin, loading, refresh: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_balance")
      .select("total_coin")
      .eq("user_id", user.id)
      .single();
    if (data) setCoin(data.total_coin);
  }};
}
