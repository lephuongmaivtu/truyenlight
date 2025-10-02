import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "../../supabaseClient";

type Props = {
  storyId: string;
  initialMy?: number;     // user đã vote mấy sao
 onRated?: (storyId: string, value: number) => void; // 👈 truyền cả storyId
};

export function StarRating({ storyId, initialMy = 0, onRated }: Props) {
  const [my, setMy] = useState(initialMy);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMy(initialMy), [initialMy]);

  const handleClick = async (value: number) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return alert("Vui lòng đăng nhập để đánh giá!");

    setMy(value); // optimistic
    onRated?.(storyId, value);

    setSaving(true);
    const { error } = await supabase
      .from("story_ratings")
      .upsert(
        { user_id: u.user.id, story_id: storyId, value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,story_id" }
      );
    if (error) console.error("❌ update rating error:", error);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((v) => {
        const active = v <= (hover || my);
        return (
          <button
            key={v}
            type="button"
            className="p-0 m-0 leading-none"
            onClick={() => !saving && handleClick(v)}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Đánh giá ${v} sao`}
          >
            <Star
              size={22}
              strokeWidth={2}
              fill={active ? "currentColor" : "none"}
              className={active ? "text-yellow-400" : "text-gray-300"}
            />
          </button>
        );
      })}
    </div>
  );
}
