import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Homepage } from './components/Homepage';
import { StoryDetail } from './components/StoryDetail';
import { ChapterReader } from './components/ChapterReader';
import { ReadingProvider } from './components/ReadingProvider';

// 👇 import đúng 1 lần thôi
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  return (
    <ReadingProvider>
      <Router>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/story/:slug" element={<StoryDetail />} />
              <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />

              {/* 👇 route mới */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ReadingProvider>
  );
}
