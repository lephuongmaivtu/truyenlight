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
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { searchStories } from "./mockData";
import { supabase } from "../supabaseClient";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [genres, setGenres] = useState<any[]>([]);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const navigate = useNavigate();

  // 🧩 Fetch user state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
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
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">TruyenLight</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 relative">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              Trang chủ
            </Link>

            {/* Dropdown Thể loại (Mega Menu) */}
            <div
              className="relative"
              onMouseEnter={() => setIsGenreOpen(true)}
              onMouseLeave={() => setIsGenreOpen(false)}
            >
              <button className="flex items-center text-foreground hover:text-primary transition-colors">
                Thể loại
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {isGenreOpen && (
                <div className="absolute left-0 mt-2 bg-card border border-border rounded-md shadow-lg w-[700px] p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2 animate-fadeIn">
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <Link
                        key={genre.id}
                        to={`/genres/${genre.slug}`}
                        className="flex items-center text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <span className="mr-2">{genre.emoji || "📘"}</span>
                        {genre.name}
                      </Link>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Đang tải thể loại...
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Search Bar */}
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
                      <div className="flex items-center space-x-3">
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <h4 className="font-medium text-foreground">{story.title}</h4>
                          <p className="text-sm text-muted-foreground">{story.author}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-3 text-muted-foreground">Không tìm thấy truyện</div>
                )}
              </div>
            )}
          </div>

          {/* Profile + Author */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <Link to="/author">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <PenSquare className="h-4 w-4 mr-2" />
                    Khu vực tác giả
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Hồ sơ
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Thoát
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu content */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="space-y-2">
              <Link
                to="/"
                className="block py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              {genres.map((g) => (
                <Link
                  key={g.id}
                  to={`/genres/${g.slug}`}
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {g.emoji || "📘"} {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
