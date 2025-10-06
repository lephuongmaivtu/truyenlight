import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">TruyenLight</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Điểm đến hàng đầu của bạn cho light novel, tiểu thuyết web và truyện viễn tưởng. Khám phá hàng ngàn câu chuyện hấp dẫn từ các tác giả tài năng trên toàn thế giới.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </Link>
              <a href="#genres" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Browse Genres
              </a>
              <a href="#latest" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Latest Updates
              </a>
              <a href="#ranking" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Top Truyện
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Hỗ trợ</h3>
            <div className="space-y-2">
              <a href="#contact" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact Us
              </a>
              <a href="#privacy" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#terms" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Terms of Use
              </a>
              <a href="#faq" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                FAQ
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Follow đi nè</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="p-2">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Cập nhật những truyện Zhihu và thông báo mới nhất!
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 TruyenLight. 
          </p>
        </div>
      </div>
    </footer>
  );
}
