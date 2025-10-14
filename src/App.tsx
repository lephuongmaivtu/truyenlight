function App() {
  return (
    <ReadingProvider>
      <Router>
        {/** ✅ Gọi hook ở đây, bên trong Router */}
        <PageTrackerAndRoutes />
      </Router>
    </ReadingProvider>
  );
}

function PageTrackerAndRoutes() {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/story/:slug/:chapterSlug" element={<ChapterReader />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
