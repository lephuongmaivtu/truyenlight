// src/pages/author/AuthorLayout.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  DollarSign,
  ListTodo,
  LogOut,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const sidebarItems = [
    { label: "Tổng quan", icon: <LayoutDashboard className="h-4 w-4" />, link: "/author" },
    { label: "Truyện của tôi", icon: <BookOpen className="h-4 w-4" />, link: "/author" },
    { label: "Đăng truyện", icon: <PlusCircle className="h-4 w-4" />, link: "/author/upload-story" },
    { label: "Đăng chapter", icon: <PlusCircle className="h-4 w-4" />, link: "/author/upload-chapter" },
    { label: "Doanh thu", icon: <DollarSign className="h-4 w-4" />, link: "/author/revenue" },
    { label: "Nhiệm vụ", icon: <ListTodo className="h-4 w-4" />, link: "/author/tasks" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border p-4 flex flex-col justify-between bg-muted/30">
        <div>
          <h2 className="text-xl font-bold mb-4">👩‍💻 Khu Vực Tác Giả</h2>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition ${
                  location.pathname === item.link ? "bg-muted font-semibold" : ""
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 mt-4"
        >
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
