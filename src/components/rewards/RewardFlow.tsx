import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Gift, CheckCircle, LogIn, Sparkles } from "lucide-react";

/** LocalStorage key cho wishlist chưa login */
const DRAFT_KEY = "tl_wishlist_draft";

/** Kiểu dữ liệu */
type CatalogItem = {
  id: string;
  name: string;
  image_url?: string | null;
  description?: string | null;
};

type Balance = {
  activity_points: number;
  streak_days: number;
};

type Draft = {
  item_id: string;
  item_name: string;
  selected_at: string; // ISO
};

function tryConfetti() {
  // confetti lazy import (không block UI nếu lib chưa cài)
  import("canvas-confetti")
    .then((m) => m.default({ particleCount: 120, spread: 70, origin: { y: 0.6 } }))
    .catch(() => {
      // fallback: nhẹ nhàng, không crash
      console.log("confetti fallback");
    });
}

/** Hook tiện: lấy session hiện tại (để biết login/chưa) */
function useSession() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

/** Hook lấy 5 item active random */
function useCatalog(limit = 5) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("rewards_catalog")
        .select("id,name,image_url,description")
        .eq("is_active", true);
      if (!mounted) return;
      if (!error && data) {
        // random pick 5
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setItems(shuffled.slice(0, limit));
      }
    })();
    return () => { mounted = false; };
  }, [limit]);
  return items;
}

/** Hook số dư + eligibility */
function useBalanceAndEligibility() {
  const [balance, setBalance] = useState<Balance>({ activity_points: 0, streak_days: 0 });
  const [eligible, setEligible] = useState(false);
  const [hasUnclaimed, setHasUnclaimed] = useState(false);

  const refetch = async () => {
    // balances
    const { data: bData, error: bErr } = await supabase
      .from("user_balances")
      .select("activity_points, streak_days")
      .single();
    if (!bErr && bData) setBalance(bData as Balance);

    // eligibility
    const { data: eData, error: eErr } = await supabase.rpc("can_claim_reward");
    if (!eErr && eData && eData.length) {
      setEligible(Boolean(eData[0].eligible));
      setHasUnclaimed(Boolean(eData[0].has_unclaimed));
    }
  };

  return { balance, eligible, hasUnclaimed, refetch, setBalance };
}

/** Hàm sync draft localStorage -> Supabase qua RPC */
async function syncDraftToSupabase(): Promise<boolean> {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return false;
  try {
    const draft = JSON.parse(raw) as Draft;
    if (!draft?.item_id || !draft?.item_name) return false;
    const { error } = await supabase.rpc("sync_wishlist", {
      p_item_id: draft.item_id,
      p_item_name: draft.item_name,
      p_selected_at: draft.selected_at,
    });
    if (error) {
      console.error("sync_wishlist error", error);
      return false;
    }
    localStorage.removeItem(DRAFT_KEY);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/** Component chính */
export default function RewardFlow() {
  const session = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loginAskOpen, setLoginAskOpen] = useState(false);
  const items = useCatalog(5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const choosingRef = useRef<string | null>(null);

  const { balance, eligible, hasUnclaimed, refetch } = useBalanceAndEligibility();

  // Lắng nghe tín hiệu mở popup từ các page khác
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("tl:openRewardPopup", handler as EventListener);
    return () => window.removeEventListener("tl:openRewardPopup", handler as EventListener);
  }, []);

  // Khi login xong, tự sync draft (nếu có)
  useEffect(() => {
    (async () => {
      if (session) {
        const ok = await syncDraftToSupabase();
        if (ok) {
          toast({ description: "Đã lưu phần thưởng thành công 🎉" });
          await refetch();
        }
      }
    })();
  }, [session]); // eslint-disable-line

  // Khi mở popup -> refresh eligibility
  useEffect(() => {
    if (open && session) refetch();
  }, [open, session]); // eslint-disable-line

  const onSelectItem = async (it: CatalogItem) => {
    if (busy) return;
    choosingRef.current = it.id;
    setSelectedId(it.id);
    setSelectedName(it.name);

    // animation: rung nhẹ card bằng CSS class
    const el = document.getElementById(`wish-${it.id}`);
    el?.classList.add("animate-[wiggle_200ms_ease-in-out_1]");
    setTimeout(() => el?.classList.remove("animate-[wiggle_200ms_ease-in-out_1]"), 250);

    tryConfetti();

    if (!session) {
      // Lưu draft và mời login
      const payload: Draft = {
        item_id: it.id,
        item_name: it.name,
        selected_at: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      toast({ description: `🎁 Bạn đã chọn ${it.name}! Hãy đăng nhập để lưu phần thưởng.` });
      setLoginAskOpen(true);
      return;
    }

    // Đã login -> sync thẳng
    setBusy(true);
    const { error } = await supabase.rpc("sync_wishlist", {
      p_item_id: it.id,
      p_item_name: it.name,
      p_selected_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      console.error(error);
      toast({ description: "Không thể lưu phần thưởng. Thử lại nhé!" });
    } else {
      toast({ description: "Đã lưu phần thưởng thành công 🎉" });
      refetch();
    }
  };

  const onClaim = async () => {
    if (!session) {
      setLoginAskOpen(true);
      return;
    }
    const { data, error } = await supabase.rpc("claim_reward");
    if (error) {
      toast({ description: "Chưa thể nhận quà. Thử lại sau nhé!" });
      return;
    }
    if (data && data.length && data[0].claimed) {
      tryConfetti();
      toast({ description: `🎊 Đã nhận quà: ${data[0].item_name}` });
      await refetch();
    } else {
      toast({ description: "Chưa đủ điều kiện hoặc chưa có wishlist." });
    }
  };

  const doLogin = async () => {
    // tuỳ hệ thống auth của m. Ở đây ví dụ Google OAuth
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
  };

  // UI
  return (
    <>
      {/* Popup chính: chọn quà & thông tin thưởng */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              🎉 Bạn vừa hoàn thành chương đầu tiên!
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Muốn nhận phần thưởng dành cho độc giả chăm chỉ không? Chọn 1 món bên dưới để thêm vào wishlist của bạn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {items.map((it) => (
              <Card key={it.id} id={`wish-${it.id}`} className={`transition hover:scale-[1.01] ${selectedId === it.id ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <img
                    src={it.image_url || "https://placehold.co/80x80"}
                    alt={it.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    {it.description && <div className="text-xs text-muted-foreground line-clamp-2">{it.description}</div>}
                    <div className="mt-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => onSelectItem(it)}
                        className="w-full"
                      >
                        {selectedId === it.id ? "Đã chọn" : "Chọn món này"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Thanh trạng thái điểm & streak + claim */}
          <div className="rounded-xl bg-muted/50 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm">Điểm hoạt động: <b>{balance.activity_points}</b></div>
              <div className="text-sm">Chuỗi điểm danh: <b>{balance.streak_days}</b> ngày</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => refetch()}>Cập nhật</Button>
              <Button disabled={!eligible || !hasUnclaimed} onClick={onClaim}>
                <CheckCircle className="h-4 w-4 mr-1" /> Nhận thưởng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup mời đăng nhập */}
      <Dialog open={loginAskOpen} onOpenChange={setLoginAskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              💫 Hãy đăng nhập để hệ thống ghi nhớ phần thưởng này nhé!
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setLoginAskOpen(false)}>Để sau</Button>
            <Button onClick={doLogin}>Đăng nhập</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS rung nhẹ (wiggle) */}
      <style>{`
        @keyframes wiggle {
          0%,100% { transform: rotate(0deg); }
          25% { transform: rotate(1.2deg); }
          75% { transform: rotate(-1.2deg); }
        }
        .animate-[wiggle_200ms_ease-in-out_1] { animation: wiggle 0.2s ease-in-out 1; }
      `}</style>
    </>
  );
}

/** ===== Helpers để trang khác gọi mở popup ===== */
export function openRewardPopup() {
  window.dispatchEvent(new CustomEvent("tl:openRewardPopup"));
}

/** Gọi sau khi điểm danh thành công lần đầu (hoặc tuỳ trigger m muốn) */
export async function afterFirstCheckinTrigger() {
  // call RPC check_in; kiểm tra nếu lần đầu (streak==1) thì mở popup
  const { data, error } = await supabase.rpc("check_in");
  if (!error && data && data.length) {
    const streak = data[0].streak_days as number;
    if (streak === 1) {
      openRewardPopup();
    }
  }
}

/** Gọi sau khi user đọc xong chương đầu tiên lần đầu */
export async function afterFirstChapterTrigger() {
  // tuỳ logic lưu localStorage hoặc table logs của m. Ở đây dùng localStorage simple flag:
  const key = "tl_first_chapter_done";
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, "1");
    openRewardPopup();
  }
  // tặng điểm đọc chương đầu (tuỳ chỉnh)
  await supabase.rpc("log_activity", { p_type: "read", p_points: 5, p_meta: { level: "first_chapter" } });
}
