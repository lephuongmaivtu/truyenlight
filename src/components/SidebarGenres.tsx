
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useIsMobile } from "../components/ui/use-mobile"; // ✅ đúng path thật
import { Button } from "../components/ui/button";

interface Genre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function SidebarGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadGenres = async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("id, name, slug, icon")
        .order("name");

      if (error) console.error("Error fetching genres:", error);
      setGenres(data || []);
      setLoading(false);
    };

    loadGenres();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-muted-foreground">
        Đang tải thể loại...
      </div>
    );
  }

  // 🧩 MOBILE VERSION — Thu gọn, xổ xuống có animation
  if (isMobile) {
    return (
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Thể loại
          </span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            open ? "max-h-[400px] mt-2 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-md border bg-background shadow-sm overflow-y-auto max-h-[400px]">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                to={`/genre/${genre.slug}`}
                className="block px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition"
                onClick={() => setOpen(false)}
              >
                {genre.icon ? `${genre.icon} ${genre.name}` : genre.name}
              </Link>
            ))}

            <div className="flex justify-center border-t">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 mb-1 text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                Thu gọn ▲
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🧩 DESKTOP VERSION — Luôn hiển thị
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
        <BookOpen className="w-4 h-4" />
        Thể loại
      </h3>
      <div className="flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            to={`/genre/${genre.slug}`}
            className="flex items-center gap-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 transition"
          >
            {genre.icon ? (
              <span className="text-lg">{genre.icon}</span>
            ) : (
              <span>📖</span>
            )}
            {genre.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
