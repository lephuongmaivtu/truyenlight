// ⚠️ Đừng render JSX ngoài component — xóa <TestReact /> ở đầu nếu có

// ✅ React & Router
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ UI Components
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/use-toast";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// ✅ Core Pages
import { Homepage } from "./components/Homepage";
import { GenrePage } from "./pages/GenrePage";
import { StoryDetail } from "./components/StoryDetail";
import { ChapterReader } from "./components/ChapterReader";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

// ✅ Hooks
import { usePageTracking } from "./hooks/usePageTracking";

// ✅ Reading Context
import { ReadingProvider } from "./components/ReadingProvider";

// ✅ Author Zone
import { AuthorDashboard } from "./pages/author/AuthorDashboard";
import { UploadStoryPage } from "./pages/author/UploadStoryPage";
import { UploadChapterPage } from "./pages/author/UploadChapterPage";
import RevenuePage from "./pages/author/RevenuePage";
import DailyTasks from "./pages/author/DailyTasks";
import RewardShop from "./pages/author/RewardShop";

// ✅ Reward System
import RewardFlow from "./components/rewards/RewardFlow";

// ✅ Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("🧱 ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            color: "red",
            background: "#111",
            minHeight: "100vh",
            textAlign: "center",
          }}
        >
          <h2>🚨 React app bị crash!</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ✅ App chính
function App() {
  console.log("✅ App component render start");
  return (
    <ErrorBoundary>
      <ReadingProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </ReadingProvider>
    </ErrorBoundary>
  );
}

// ✅ Nội dung chính của App
function AppContent() {
  console.log("✅ AppContent render start");

  try {
    usePageTracking();
    console.log("✅ usePageTracking hook chạy OK");
  } catch (err) {
    console.error("❌ Lỗi trong usePageTracking:", err);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {console.log("✅ Render Header")}
      <Header />

      {console.log("✅ Render Toaster (trước Routes)")}
      <Toaster />

      <main className="flex-1">
        {console.log("✅ Render Routes bắt đầu")}
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />
          <Route path="/genres/:slug" element={<GenrePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/author" element={<AuthorDashboard />} />
          <Route path="/author/upload-story" element={<UploadStoryPage />} />
          <Route path="/author/upload-chapter" element={<UploadChapterPage />} />
          <Route path="/author/revenue" element={<RevenuePage />} />
          <Route path="/author/tasks" element={<DailyTasks />} />
          <Route path="/shop" element={<RewardShop />} />
        </Routes>
        {console.log("✅ Routes render xong")}
      </main>

      {console.log("✅ Render RewardFlow")}
      <RewardFlow />

      {console.log("✅ Render Toaster (sau RewardFlow)")}
      <Toaster />

      {console.log("✅ Render Footer")}
      <Footer />

      {console.log("✅ AppContent render hoàn tất")}
    </div>
  );
}

// ✅ Bắt lỗi toàn cục (JS ngoài React)
window.addEventListener("error", (e) => {
  console.error("❌ Global JS Error:", e.message, e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("⚠️ Unhandled Promise:", e.reason);
});

export default App;
