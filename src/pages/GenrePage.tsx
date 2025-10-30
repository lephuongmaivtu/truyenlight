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
    if (slug) loadGenreAndStories();
  }, [slug]);

  async function loadGenreAndStories() {
    setLoading(true);
    const { data: genre } = await supabase
      .from("genres")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();

    const name = genre?.name || slug;
    setGenreName(name);

    const { data: stories, error } = await supabase
      .from("stories")
      .select("*")
      .or(`genres.cs.{${name}},genres.cs.{${slug}}`)
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch stories error:", error);
    setStories(stories || []);
    setLoading(false);
  }

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Đang tải truyện...</p>
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
