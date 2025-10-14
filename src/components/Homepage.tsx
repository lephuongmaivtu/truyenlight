declare global {
  interface Window {
    FB: any;
  }
}


import React, { useEffect, useState } from "react";
import { Search, TrendingUp, Clock, Star, CheckCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { StoryCard } from "./StoryCard";
import { supabase } from "../supabaseClient";

export function Homepage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stories, setStories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [featuredStories, setFeaturedStories] = useState<any[]>([]);
  const [topStories, setTopStories] = useState<any[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [topRatedStories, setTopRatedStories] = useState<any[]>([]);
  const [visibleStories, setVisibleStories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadMoreStories = () => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * 6;
    const end = start + 6;
  

  
  
    const newStories = stories.slice(start, end);
    if (newStories.length > 0) {
      setVisibleStories((prev) => [...prev, ...newStories]);
      setPage(nextPage);
    }
  };
  
  // Fetch tất cả stories
    useEffect(() => {
      async function fetchStatuses() {
        const { data, error } = await supabase
          .from("statuses")
          .select(`
            id, title, content, image_url, created_at,
            stories ( id, title, slug )
          `)
          .order("created_at", { ascending: false })
          .limit(10);
    
        if (!error && data) setStatuses(data);
      }
      fetchStatuses();
    }, []);

  useEffect(() => {
    async function fetchData() {
      
      // fetch stories
      const { data, error } = await supabase
        .from("stories")
        .select(`
          *,
          story_rating_stats(avg_rating, rating_count)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map((story: any) => ({
          ...story,
          coverImage: story.coverImage,
          lastUpdated: story.created_at,
          rating: story.story_rating_stats?.avg_rating ?? 0,
          ratingCount: story.story_rating_stats?.rating_count ?? 0,
        }));
        setStories(mapped);
        setVisibleStories(mapped.slice(0, 6));
      }
      
       

      // fetch latest
      const { data: latestData, error: latestError } = await supabase
        .from("stories")
        .select(`*, story_rating_stats(avg_rating, rating_count)`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!latestError && latestData) {
        const mapped = latestData.map((story: any) => ({
          ...story,
          coverImage: story.coverImage,
          lastUpdated: story.lastupdated ?? story.created_at,
          rating: story.story_rating_stats?.avg_rating ?? 0,
          ratingCount: story.story_rating_stats?.rating_count ?? 0,
        }));
        setLatestUpdates(mapped);
      }

      // fetch featured
      const { data: featuredData, error: featuredError } = await supabase
        .from("stories")
        .select(`*, story_rating_stats(avg_rating, rating_count)`)
        .eq("is_featured", true)
        .limit(8);

      if (!featuredError && featuredData) {
        const mapped = featuredData.map((story: any) => ({
          ...story,
          coverImage: story.coverImage,
          lastUpdated: story.updated_at ?? story.created_at,
          rating: story.story_rating_stats?.avg_rating ?? 0,
          ratingCount: story.story_rating_stats?.rating_count ?? 0,
        }));
        setFeaturedStories(mapped);
      }

      // fetch top by views
      const topStories = await getTopStoriesByViews();
      setTopStories(topStories);

      // fetch top by rating
      const ratedStories = await getTopStoriesByRating();
      setTopRatedStories(ratedStories);
    }

    fetchData();
  }, []);
  
useEffect(() => {
  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
    ) {
      loadMoreStories();
    }
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, [page, stories]);
  
  const getTopStoriesByViews = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("views", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase fetch top stories error:", error);
      return [];
    }
    return data || [];
  };

  const getTopStoriesByRating = async () => {
  const { data, error } = await supabase
    .from("story_rating_stats")
    .select(`
      avg_rating,
      rating_count,
      stories:stories(*)
    `) // lấy tất cả cột của stories để khỏi sai tên
    .order("avg_rating", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Supabase fetch top stories by rating error:", error?.message, error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row.stories,                     // toàn bộ fields có thật trong bảng stories
    rating: row.avg_rating ?? 0,
    ratingCount: row.rating_count ?? 0,
  }));
};


  const refreshStoryRating = async (storyId: string) => {
    const { data, error } = await supabase
      .from("story_rating_stats")
      .select("avg_rating, rating_count")
      .eq("story_id", storyId)
      .single();

    if (!error && data) {
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, rating: data.avg_rating, ratingCount: data.rating_count }
            : s
        )
      );

      setTopRatedStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, rating: data.avg_rating, ratingCount: data.rating_count }
            : s
        )
      );

      setLatestUpdates((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, rating: data.avg_rating, ratingCount: data.rating_count }
            : s
        )
      );

      setFeaturedStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, rating: data.avg_rating, ratingCount: data.rating_count }
            : s
        )
      );
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const results = stories.filter((story) =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    }
  };
 useEffect(() => {
          // Đảm bảo Facebook SDK parse lại sau khi component render
          if (window.FB) {
            window.FB.XFBML.parse();
          }
        }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-r from-primary/5 to-primary/5 py-6">
        <div className="container mx-auto px-4">
          <img
            src="https://i.ibb.co/zhKSq1L0/Truyenlighttl-2.png"
            alt="Banner"
            className="w-full h-40 md:h-56 lg:h-64 object-cover shadow"
          />
          <form onSubmit={handleSearch} className="w-full flex justify-center">
            <div className="relative w-full max-w-md md:max-w-sm lg:max-w-md">
              <Input
                type="text"
                placeholder="VD: Phong bì trả nợ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 md:h-9 lg:h-10 pl-10 pr-24 text-base md:text-sm lg:text-base rounded-lg shadow"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs md:text-sm"
              >
                Tìm
              </Button>
            </div>
          </form>
        </div>
      </section>

      {showSearchResults && (
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Search Results for "{searchQuery}"
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowSearchResults(false)}
              >
                Clear
              </Button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {searchResults.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onRated={refreshStoryRating}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No stories found.</p>
              </div>
            )}
          </div>
        </section>
      )}

{/* 🌟 BẢNG TIN MỚI NHẤT */}
<section className="mb-10">
  <div className="flex items-center space-x-2 mb-4">
    <h2 className="text-2xl font-bold text-foreground">Bảng tin mới nhất</h2>
  </div>

  {/* ✅ Toàn bộ feed nằm trong 1 khung có scroll riêng */}
  <div className="border rounded-xl shadow-sm bg-white overflow-hidden max-h-[420px] flex flex-col">
    <div className="overflow-y-auto flex-1 p-4 space-y-6">
      {statuses.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Chưa có bài đăng nào.
        </p>
      ) : (
        statuses.map((s) => (
          <div
            key={s.id}
            className="border-b last:border-b-0 border-gray-100 pb-4"
          >
            {/* Tiêu đề */}
            <h3 className="font-semibold text-base mb-1 leading-snug">
              {s.title || "Không có tiêu đề"}
            </h3>

            {/* Văn án */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {expanded === s.id
                ? s.content
                : s.content.slice(0, 150) +
                  (s.content.length > 150 ? "..." : "")}
            </p>

            {/* Hành động */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {s.content.length > 150 && (
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="text-blue-600 hover:underline"
                >
                  {expanded === s.id ? "Thu gọn" : "Xem thêm"}
                </button>
              )}

              <button
                onClick={() => {
                  const link =
                    window.location.origin +
                    `/story/${s.stories?.[0]?.slug ?? ""}`;
                  navigator.clipboard.writeText(link);
                  alert("Đã sao chép link bài viết!");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Chia sẻ
              </button>

              {s.stories?.[0]?.slug && (
                <a
                  href={`/story/${s.stories[0].slug}`}
                  className="text-black hover:underline font-medium"
                >
                  Đọc truyện
                </a>
              )}
            </div>

            {/* Ngày đăng */}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(s.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
</section>




          {/* 🕒 top đề xuất */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Star className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Top đề xuất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredStories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="compact" />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Truyện mới nhất nè</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {latestUpdates.slice(0, 5).map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onRated={refreshStoryRating}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Top truyện trong tháng
                </h2>
              </div>
              <Tabs defaultValue="views" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="views">By Views</TabsTrigger>
                  <TabsTrigger value="rating">By Rating</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value="views" className="mt-6">
                  <div className="grid grid-cols-1 gap-4">
                    {topStories.slice(0, 5).map((story, index) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-3 w-full overflow-hidden"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <StoryCard story={story} variant="compact" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rating" className="mt-6">
                  <div className="grid grid-cols-1 gap-4">
                    {topRatedStories.slice(0, 5).map((story, index) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-3 w-full overflow-hidden"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <StoryCard story={story} variant="compact" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="mt-6">
                  <div className="grid grid-cols-1 gap-4">
                    {latestUpdates.slice(0, 5).map((story, index) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-3 w-full overflow-hidden"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <StoryCard story={story} variant="compact" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </section>

                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Tất cả truyện</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleStories.map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                </section>
            
          </div>

          <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Theo dõi fanpage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="fb-page"
                data-href="https://www.facebook.com/truyenlight"   // ⚠️ đổi link fanpage thật của m
                data-tabs="timeline"
                data-width="340"
                data-height="500"
                data-small-header="false"
                data-adapt-container-width="true"
                data-hide-cover="false"
                data-show-facepile="true"
              >
                <blockquote
                  cite="https://www.facebook.com/truyenlight"
                  className="fb-xfbml-parse-ignore"
                >
                  <a href="https://www.facebook.com/truyenlight">TruyenLight</a>
                </blockquote>
              </div>
            </CardContent>
          </Card>


            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span>You May Also Like</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topStories.slice(0, 4).map((story) => (
                  <StoryCard key={story.id} story={story} variant="compact" />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tất cả các truyện
                  </span>
                  <span className="font-semibold">{stories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">
                    {stories.filter((s) => s.status === "completed").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

