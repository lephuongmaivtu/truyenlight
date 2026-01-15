// ✅ React & Router
import { useRewardSync } from "./hooks/useRewardSync";
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
import { AuthorStoryChaptersPage } from "./pages/author/AuthorStoryChaptersPage";
import { EditStoryPage } from "./pages/author/EditStoryPage";



// ✅ Reward System
import RewardFlow from "./components/rewards/RewardFlow";

function App() {
  return (
    <ReadingProvider>
      <ToastProvider>
        {/* ✅ Bọc toàn bộ App */}
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ReadingProvider>
  );
}

function AppContent() {
  usePageTracking();
   useRewardSync();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Toaster /> {/* ✅ Dùng để hiển thị popup/toast */}
      
      <main className="flex-1">
        <Routes>
          {/* ✅ Public Pages */}
          <Route path="/" element={<Homepage />} />
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />
          <Route path="/genres/:slug" element={<GenrePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ✅ Author Zone */}
          <Route path="/author" element={<AuthorDashboard />} />
          <Route path="/author/edit-story/:storyId" element={<EditStoryPage />} />
          <Route path="/author/upload-story" element={<UploadStoryPage />} />
          <Route path="/author/upload-chapter" element={<UploadChapterPage />} />
          <Route path="/author/revenue" element={<RevenuePage />} />
          <Route path="/author/tasks" element={<DailyTasks />} />
          <Route path="/author/story/:storyId/chapters" element={<AuthorStoryChaptersPage />} />
          


          {/* ✅ Reward System */}
          <Route path="/shop" element={<RewardShop />} />
        </Routes>
      </main>
      <Toaster />
      <RewardFlow />
      <Footer />
    </div>
  );
}

export default App;
