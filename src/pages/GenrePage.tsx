import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { StoryCard } from "../components/StoryCard";
import { Button } from "../components/ui/button";

export function GenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const [stories, setStories] = useState<any[]>([]);
  const [genreName, setGenreName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadGenreAndStories();
    }
  }, [slug]);

  async function loadGenreAndStories() {
    setLoading(true);

    // 🧠 B1: Lấy tên thể loại thật (vd: "Mạt Thế") từ bảng genres
    const { data: genre, error: genreErr } = await supabase
      .from("genres")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();

    const name = genre?.name || slug;
    setGenreName(name);

    // 🧠 B2: Lọc theo mảng `genres[]` chứa TÊN hoặc SLUG
    // Nếu genres trong DB chứa ["Ngôn Tình", "Mạt Thế"] → match theo name
    // Nếu chứa ["ngon-tinh", "mat-the"] → match theo slug
    const { data: stories, error: storyErr } = await supabase
      .from("stories")
      .select("*")
      .or(`genres.cs.{${name}},genres.cs.{${slug}}`) // ✅ lọc theo 2 kiểu luôn
      .order("created_at", { ascending: false });

    if (storyErr) console.error("Fetch stories error:", storyErr);
    setStories(stories || []);
    setLoading(false);
  }

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground text-center">Đang tải truyện...</p>
      </div>
    );

  if (stories.length === 0)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          {genreName || "Thể loại"} chưa có truyện nào
        </h1>
        <Link to="/">
          <Button>Quay lại trang chủ</Button>
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">
        Thể loại: {genreName || slug}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={{
              id: story.id,
              title: story.title,
              author: story.author || "Đang cập nhật",
              coverImage:
                story.coverImage ||
                story.coverimage ||
                "https://placehold.co/300x400?text=No+Image",
              slug: story.slug,
              rating: story.rating || 0,
              views: story.views || 0,
              status: story.status || "Ongoing",
              genres: story.genres || [],
              lastUpdated: story.updated_at || story.created_at,
            }}
          />
        ))}
      </div>
    </div>
  );
}
