import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

// Author pages
import { AuthorDashboard } from "./pages/AuthorDashboard";
import { UploadStoryPage } from "./pages/UploadStoryPage";
import { UploadChapterPage } from "./pages/UploadChapterPage";

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
  usePageTracking(); // ✅ theo dõi GA4 pageview

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <Routes>
          {/* Trang chính */}
          <Route path="/" element={<Homepage />} />

          {/* Truyện & Chương */}
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />

          {/* Tài khoản */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Khu vực tác giả */}
          <Route path="/author" element={<AuthorDashboard />} />
          <Route path="/author/upload-story" element={<UploadStoryPage />} />
          <Route path="/author/upload-chapter" element={<UploadChapterPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
