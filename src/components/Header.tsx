import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, BookOpen, User, LogOut, PenSquare } from "lucide-react";
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

  // 🧠 Fetch genres từ Supabase
  useEffect(() => {
    async function fetchGenres() {
      const { data, error } = await supabase.from("genres").select("id, name, slug").order("name");
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
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>

            {/* Dropdown Thể loại */}
            <div className="relative group">
              <span className="cursor-pointer text-foreground hover:text-primary transition-colors">
                Thể loại
              </span>
              <div className="absolute left-0 mt-2 hidden group-hover:block bg-card border border-border rounded-md shadow-lg w-48 max-h-80 overflow-y-auto z-50">
                {genres.length > 0 ? (
                  genres.map((genre) => (
                    <Link
                      key={genre.id}
                      to={`/genres/${genre.slug}`}
                      className="block px-4 py-2 hover:bg-muted text-sm text-foreground border-b border-border last:border-b-0"
                    >
                      {genre.name}
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">Đang tải...</div>
                )}
              </div>
            </div>
          </nav>

          {/* Search Bar - Desktop */}
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

            {/* Search Results Dropdown */}
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

          {/* Login/Profile + Author buttons */}
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

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
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
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
