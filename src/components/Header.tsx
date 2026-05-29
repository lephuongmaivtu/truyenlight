import { useBalance } from "../hooks/useBalance";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  BookOpen,
  User,
  LogOut,
  PenSquare,
  ChevronDown,
  ChevronUp,
  Gift,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { searchStories } from "./mockData";
import { supabase } from "../supabaseClient";
import { FEATURES } from "../config/features";

export function Header() {
  const { balance } = useBalance();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isMobileGenreOpen, setIsMobileGenreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchGenres() {
      const { data, error } = await supabase
        .from("genres")
        .select("id, name, slug, emoji")
        .order("name");
      if (!error && data) setGenres(data);
    }
    fetchGenres();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchStories(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setShowSearchResults(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">TruyenLight</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8 relative overflow-visible">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>

            {/* Dropdown Thể loại */}
            <div className="relative">
              <button
                onClick={() => setIsGenreOpen(!isGenreOpen)}
                className="cursor-pointer flex items-center text-foreground hover:text-primary transition-colors select-none"
              >
                Thể Loại
                {isGenreOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </button>

              {isGenreOpen && (
                <div
                  className="
                    absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-[9999]
                    grid grid-cols-4 gap-x-8 gap-y-3 p-4 min-w-[900px] max-w-[95vw] max-h-[70vh]
                    overflow-y-auto animate-fadeIn
                    scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-muted/60 hover:scrollbar-thumb-muted/80
                  "
                  style={{
                    WebkitOverflowScrolling: "touch",
                    scrollbarGutter: "stable",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
                  }}
                >
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <Link
                        key={genre.id}
                        to={`/genres/${genre.slug}`}
                        className="
                          flex items-center gap-2 px-3 py-2 text-[15px] text-foreground
                          hover:text-primary hover:bg-muted/40 rounded-lg transition-colors
                        "
                        onClick={() => setIsGenreOpen(false)}
                      >
                        <span className="text-[16px]">{genre.emoji || "📘"}</span>
                        <span className="whitespace-nowrap">{genre.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-1.25">
                      Đang tải thể loại...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reward Shop */}
           {FEATURES.REWARD_SHOP && (
              <Link
                to="/shop"
                className="cursor-pointer flex items-center text-foreground hover:text-primary transition-colors"
              >
                <Gift className="h-4 w-4 mr-1" />
                Reward Shop
              </Link>
            )}
          </nav>
          
          {/* Desktop search */}
          <div className="hidden">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                placeholder="VD: Thiếu niên hoa hồng..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </form>
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.slice(0, 5).map((story) => (
                    <Link
                      key={story.id}
                      to={`/story/${story.slug}`}
                      className="block p-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      onClick={() => setShowSearchResults(false)}
                    >
                      {story.title}
                    </Link>
                  ))
                ) : (
                  <div className="p-3 text-muted-foreground">Không tìm thấy truyện</div>
                )}
              </div>
            )}
          </div>

          {/* Profile section */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <Link to="/author">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <PenSquare className="h-4 w-4 mr-2" /> Khu vực tác giả
                  </Button>
                </Link>
                
                {FEATURES.COINS && (
                  <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                    💰 {balance ?? 0} xu
                  </div>
                )}

                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" /> Hồ sơ
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="bg-white text-primary hover:bg-gray-100">
                  <LogOut className="h-4 w-4 mr-2" /> Thoát
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" /> Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-3">
            <div className="space-y-2 max-h-[75vh] overflow-y-auto">
              <Link to="/" className="block py-2 px-2 text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>
             {FEATURES.REWARD_SHOP && (
                  <Link
                    to="/shop"
                    className="block py-2 px-2 text-foreground hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🎁 Reward Shop
                  </Link>
                )}
               
              {user ? (
                <>
                  <Link to="/profile" className="block py-2 px-2 text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    👤 Hồ sơ
                  </Link>
                  
                  {FEATURES.COINS && (
                     <div className="flex items-center gap-2 px-3 py-2 text-yellow-600 font-medium">
                      💰 {balance ?? 0} xu
                     </div>
                   )}
                  <Link to="/author" className="block py-2 px-2 text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    ✍️ Khu vực tác giả
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left py-2 px-2 text-foreground hover:text-red-500">
                    🚪 Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-2 px-2 text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    🔑 Đăng nhập
                  </Link>
                  <Link to="/register" className="block py-2 px-2 text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    📝 Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
