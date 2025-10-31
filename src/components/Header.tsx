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
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { searchStories } from "./mockData";
import { supabase } from "../supabaseClient";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isMobileGenreOpen, setIsMobileGenreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const navigate = useNavigate();

  // 🧩 Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // 🧠 Fetch genres
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
    <header className="bg-card border-b border-border sticky top-0 z-50 relative">
      <div className="container mx-auto px-4">
        {/* ================= HEADER TOP ================= */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">TruyenLight</span>
          </Link>

          {/* ===== Desktop nav ===== */}
          <nav className="hidden md:flex items-center space-x-8 relative">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>

  {/* Dropdown Thể loại (1 cột dọc như hình) */}
        <div
          className="relative group"
          onMouseEnter={() => setIsGenreOpen(true)}
          onMouseLeave={() => setIsGenreOpen(false)}
        >
          <button
            onClick={() => setIsGenreOpen(!isGenreOpen)}
            className="cursor-pointer flex items-center text-foreground hover:text-primary transition-colors"
          >
            Thể Loại
            <ChevronDown className="ml-1 h-4 w-4" />
          </button>
        
          {isGenreOpen && (
            <div
              className="
                absolute left-0 mt-2
                bg-card border border-border rounded-xl shadow-lg
                w-[200px] z-50
                flex flex-col gap-[2px]
                max-h-[70vh] overflow-y-auto
                overscroll-contain
                scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-muted/60 hover:scrollbar-thumb-muted/80
                animate-fadeIn
              "
              style={{
                scrollbarGutter: "stable",
                WebkitOverflowScrolling: "touch", // giúp scroll mượt trên mobile
              }}
            >

              {genres.length > 0 ? (
                genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to={`/genres/${genre.slug}`}
                    className="
                      flex items-center gap-2
                      px-3 py-2 text-[15px] text-foreground
                      hover:text-primary hover:bg-muted/40
                      rounded-lg transition-colors
                    "
                  >
                    <span className="text-[16px]">{genre.emoji || "📘"}</span>
                    <span className="whitespace-nowrap">{genre.name}</span>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-muted-foreground px-3 py-2">
                  Đang tải thể loại...
                </div>
              )}
            </div>
          )}
        </div>


          </nav>

          {/* ===== Desktop search ===== */}
          <div className="hidden md:block relative">
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

          {/* ===== Desktop profile ===== */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <Link to="/author">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <PenSquare className="h-4 w-4 mr-2" /> Khu vực tác giả
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" /> Hồ sơ
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-white text-primary hover:bg-gray-100"
                >
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

          {/* ===== Mobile menu toggle ===== */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* ================= MOBILE MENU ================= */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-3">
            <div className="space-y-2 max-h-[75vh] overflow-y-auto">
              {/* Trang chủ */}
              <Link
                to="/"
                className="block py-2 px-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>

              {/* Thể loại toggle */}
              <button
                onClick={() => setIsMobileGenreOpen(!isMobileGenreOpen)}
                className="w-full flex justify-between items-center py-2 px-2 text-foreground hover:text-primary"
              >
                <span>Thể loại</span>
                {isMobileGenreOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

             {isMobileGenreOpen && (
              <div
                className="
                  pl-3 border-l border-border
                  space-y-1
                  max-h-[60vh] overflow-y-auto overscroll-contain
                  scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-muted/60 hover:scrollbar-thumb-muted/80
                  pr-1
                "
                style={{
                  WebkitOverflowScrolling: "touch", // cuộn mượt trên iOS & mobile
                  scrollbarGutter: "stable",        // tránh layout nhảy khi cuộn
                }}
              >

                  {genres.map((g) => (
                    <Link
                      key={g.id}
                      to={`/genres/${g.slug}`}
                      className="
                        flex items-center gap-2 px-3 py-2 text-[15px] text-foreground 
                        hover:text-primary hover:bg-muted/40 transition-colors rounded-lg
                      "
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileGenreOpen(false);
                      }}
                    >
                      <span className="text-[16px]">{g.emoji || "📘"}</span>
                      <span className="whitespace-nowrap">{g.name}</span>
                    </Link>
                  ))}
                </div>
              )}


              {/* Khu vực tác giả */}
              {user && (
                <Link
                  to="/author"
                  className="block py-2 px-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ✍️ Khu vực tác giả
                </Link>
              )}

              {/* Hồ sơ hoặc đăng nhập */}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block py-2 px-2 text-foreground hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 Hồ sơ
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-2 text-foreground hover:text-red-500"
                  >
                    🚪 Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block py-2 px-2 text-foreground hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🔑 Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 px-2 text-foreground hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
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
