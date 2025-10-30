import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🧩 Layout & Pages
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Homepage } from "./components/Homepage";
import { StoryDetail } from "./components/StoryDetail";
import { ChapterReader } from "./components/ChapterReader";
import { GenrePage } from "./pages/GenrePage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

// 🧠 Providers & Hooks
import { ReadingProvider } from "./components/ReadingProvider";
import { usePageTracking } from "./hooks/usePageTracking";

// 🧰 UI
import { ToastProvider } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";

// 🎯 Rewards & Gamification
import RewardFlow from "./components/rewards/RewardFlow";
import DailyTasks from "./pages/author/DailyTasks";
import RewardShop from "./pages/author/RewardShop";

// ✍️ Author zone
import { AuthorDashboard } from "./pages/author/AuthorDashboard";
import { UploadStoryPage } from "./pages/author/UploadStoryPage";
import { UploadChapterPage } from "./pages/author/UploadChapterPage";
import RevenuePage from "./pages/author/RevenuePage";

function App() {
  return (
    <ReadingProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ReadingProvider>
  );
}

function AppContent() {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />
          <Route path="/genres/:slug" element={<GenrePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ✍️ Author Zone */}
          <Route path="/author" element={<AuthorDashboard />} />
          <Route path="/author/upload-story" element={<UploadStoryPage />} />
          <Route path="/author/upload-chapter" element={<UploadChapterPage />} />
          <Route path="/author/revenue" element={<RevenuePage />} />
          <Route path="/author/tasks" element={<DailyTasks />} />

          {/* 🎁 Rewards */}
          <Route path="/shop" element={<RewardShop />} />
        </Routes>
      </main>

      {/* 🪄 Pop-up phần thưởng */}
    

      <Toaster />
      <RewardFlow />

      <Footer />
    </div>
  );
}

export default App;
