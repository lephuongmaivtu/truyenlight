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
  const fetchFeatured = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("is_featured", true)
      .limit(8);

    if (error) {
      console.error("Supabase fetch featured error:", error);
    } else {
      setFeaturedStories(data || []);
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
          <form onSubmit={handleSearch} className="w-full flex justify-center">
            <div className="relative w-full max-w-lg">
              <Input
                type="text"
                placeholder="VD: Phong bì trả nợ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-24 text-lg rounded-lg shadow"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-9 px-4 text-sm"
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
              <h2 className="text-2xl font-bold text-foreground">Featured Stories</h2>
            </div>
          
            {/* Mobile: list dọc gọn gàng */}
            <div className="block md:hidden space-y-4">
              {featuredStories.map((story) => (
                <StoryCard key={story.id} story={story} variant="compact" />
              ))}
            </div>
          
            {/* Desktop: giữ dạng grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStories.map((story) => (
                <StoryCard key={story.id} story={story} variant="featured" />
              ))}
            </div>
          </section>



            {/* Latest Updates */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Latest Updates</h2>
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
                <h2 className="text-2xl font-bold text-foreground">Top Stories</h2>
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
                    {[...topStories]
                      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                      .slice(0, 5)
                      .map((story, index) => (
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
                  <span>Completed Stories</span>
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
                  <span className="text-muted-foreground">Total Stories</span>
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
