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

  
  // Fetch tất cả stories
 useEffect(() => {
  const fetchStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
    } else {
      console.log("Fetched stories:", data);
      // Map lại field cho khớp UI (StoryCard.tsx dùng camelCase)
      const mapped = (data || []).map((story) => ({
        ...story,
        coverImage: story.coverImage,   // DB trả về "coverimage"
        lastUpdated: story.created_at,  // dùng cho Clock
      }));
      setStories(mapped);
    }
  };
 const fetchTop = async () => {
    const stories = await getTopStoriesByViews();
    setTopStories(stories);
  };
  fetchTop();
   const fetchLatest = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      const mapped = data.map((story) => ({
        ...story,
        coverImage: story.coverImage,
        lastUpdated: story.lastupdated ?? story.created_at,
      }));
      setLatestUpdates(mapped);
    }
  };
  fetchLatest();

    const stories = await getTopStoriesByViews();
        setTopStories(stories);
      };
    
      const fetchTopRated = async () => {
        const stories = await getTopStoriesByRating();
        setTopRatedStories(stories);
      };
    
      fetchTop();
      fetchTopRated();
   
  const fetchFeatured = async () => {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_featured", true)
    .limit(8);

  if (error) {
    console.error("Supabase fetch featured error:", error);
  } else {
    const mapped = (data || []).map((story) => ({
      ...story,
      coverImage: story.coverImage, // giữ đúng tên field trong Supabase
      lastUpdated: story.updated_at ?? story.created_at,
    }));
    setFeaturedStories(mapped);
  }
};


  // gọi cả 2 hàm
  fetchStories();
  fetchFeatured();
}, []);

// trong Homepage.tsx
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
    .from("stories")
    .select(`
      id, slug, title, author, description, coverimage, views, status, genres, lastupdated,
      story_rating_stats(avg_rating, rating_count)
    `)
    .order("story_rating_stats.avg_rating", { ascending: false }) // 👈 quan trọng
    .limit(10);

  if (error) {
    console.error("Supabase fetch top stories by rating error:", error);
    return [];
  }

  return (data || []).map((story) => ({
    ...story,
    rating: story.story_rating_stats?.avg_rating ?? 0,
    ratingCount: story.story_rating_stats?.rating_count ?? 0,
  }));
};


  // Handle search
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

     return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-r from-primary/5 to-primary/5 py-6">
        <div className="container mx-auto px-4">
         {/* Banner */}
          <img
              src="https://i.ibb.co/zhKSq1L0/Truyenlighttl-2.png" // đổi thành link ảnh banner của m
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



      {/* Search Results */}
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
                  <StoryCard key={story.id} story={story} />
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

      {/* Main Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content (3/4) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Featured Stories */}
           <section>
              <div className="flex items-center space-x-2 mb-6">
                <Star className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Top đề xuất</h2>
              </div>
            
              {/* Grid responsive: mobile 1 cột, tablet 2 cột, desktop 3 cột */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredStories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="compact" />
                ))}
              </div>
            </section>




            {/* Latest Updates */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Truyện mới nhất nè</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {latestUpdates.slice(0, 5).map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
              
            </section>

           {/* Rankings / Top Stories */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Top truyện trong tháng</h2>
              </div>
            
              <Tabs defaultValue="views" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="views">By Views</TabsTrigger>
                  <TabsTrigger value="rating">By Rating</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
            
                {/* By Views */}
                <TabsContent value="views" className="mt-6">
                  <div className="grid grid-cols-1 gap-4">
                    {topStories.slice(0, 5).map((story, index) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-3 w-full overflow-hidden"
                      >
                        {/* số thứ tự */}
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
            
                        {/* story card */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <StoryCard story={story} variant="compact" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
            
                {/* By Rating */}
               <TabsContent value="rating" className="mt-6">
                  <div className="grid grid-cols-1 gap-4">
                    {topRatedStories.slice(0, 5).map((story, index) => (
                      <div key={story.id} className="flex items-center gap-3 w-full overflow-hidden">
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

            
                {/* By Recent */}
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
          </div>

          {/* Sidebar (1/4) */}
          <div className="space-y-6">
            
            {/* Completed Stories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Truyện đã hoàn</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stories
                  .filter((s) => s.status === "completed")
                  .slice(0, 4)
                  .map((story) => (
                    <StoryCard key={story.id} story={story} variant="compact" />
                  ))}
              </CardContent>
            </Card>

            {/* You May Also Like */}
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

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tất cả các truyện</span>
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
