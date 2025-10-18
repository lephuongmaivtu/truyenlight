import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Card, CardContent } from "../components/ui/card";
import { Eye } from "lucide-react";

export function GenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const [genre, setGenre] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGenreAndStories() {
      setLoading(true);

      // 1️⃣ Lấy thông tin thể loại theo slug
      const { data: genreData, error: genreErr } = await supabase
        .from("genres")
        .select("*")
        .eq("slug", slug)
        .single();

      if (genreErr || !genreData) {
        console.error("Không tìm thấy thể loại:", genreErr);
        setLoading(false);
        return;
      }

      setGenre(genreData);

      // 2️⃣ Lấy truyện thuộc thể loại đó
      const { data: storyData, error: storyErr } = await supabase
        .from("stories")
        .select("id, title, slug, cover_url, views, author, genres (slug)")
        .contains("genres", [slug])
        .order("views", { ascending: false });

      if (storyErr) console.error(storyErr);
      setStories(storyData || []);
      setLoading(false);
    }

    if (slug) fetchGenreAndStories();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        Đang tải truyện...
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        Không tìm thấy thể loại.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        {genre.name}
      </h1>

      {stories.length === 0 ? (
        <p className="text-muted-foreground">Hiện chưa có truyện nào trong thể loại này.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {stories.map((story) => (
            <Link key={story.id} to={`/story/${story.slug}`}>
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-0">
                  <img
                    src={story.cover_url}
                    alt={story.title}
                    className="w-full h-56 object-cover rounded-t-md"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold line-clamp-2 text-foreground">{story.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {story.author || "Đang cập nhật"}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                      <Eye className="h-3 w-3 mr-1" /> {story.views ?? 0} lượt xem
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
