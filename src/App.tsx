import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GenrePage } from "./pages/GenrePage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Homepage } from "./components/Homepage";
import { StoryDetail } from "./components/StoryDetail";
import { ChapterReader } from "./components/ChapterReader";
import { ReadingProvider } from "./components/ReadingProvider";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { usePageTracking } from "./hooks/usePageTracking";
import DailyTasks from "./pages/author/DailyTasks";
import RewardShop from "./pages/author/RewardShop";

// ✅ Khu vực tác giả
import { AuthorDashboard } from "./pages/author/AuthorDashboard";
import { UploadStoryPage } from "./pages/author/UploadStoryPage";
import { UploadChapterPage } from "./pages/author/UploadChapterPage";
import RevenuePage from "./pages/author/RevenuePage";

// ✅ Thêm RewardFlow popup (quà tặng sau khi đọc xong chương đầu / điểm danh lần đầu)
import RewardFlow from "./components/rewards/RewardFlow";

function App() {
  return (
    <ReadingProvider>
      <Router>
        <AppContent />
      </Router>
    </ReadingProvider>
  );
}

function AppContent() {
  usePageTracking(); // ✅ GA4 pageview tracking

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* ✅ Thêm RewardFlow vào cấp global — popup luôn sẵn nhưng không ảnh hưởng giao diện */}
      <RewardFlow />

      <main className="flex-1">
        <Routes>
          {/* Trang chính */}
          <Route path="/" element={<Homepage />} />

          {/* Truyện & Chương */}
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />
          <Route path="/genres/:slug" element={<GenrePage />} />

          {/* Tài khoản */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Khu vực tác giả */}
          <Route path="/author" element={<AuthorDashboard />} />
          <Route path="/author/upload-story" element={<UploadStoryPage />} />
          <Route path="/author/upload-chapter" element={<UploadChapterPage />} />
          <Route path="/author/revenue" element={<RevenuePage />} />

          {/* Khu vực nhiệm vụ & cửa hàng */}
          <Route path="/author/tasks" element={<DailyTasks />} />
          <Route path="/shop" element={<RewardShop />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
