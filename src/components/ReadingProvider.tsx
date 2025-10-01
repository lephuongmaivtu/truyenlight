import React, { createContext, useContext, useState, useEffect } from 'react';

interface ReadingPreferences {
  fontSize: number;
  darkMode: boolean;
}

interface Bookmark {
  storySlug: string;
  chapterSlug: string;
  scrollPosition: number;
}

interface ReadingContextType {
  preferences: ReadingPreferences;
  updatePreferences: (prefs: Partial<ReadingPreferences>) => void;
  bookmarks: Record<string, Bookmark>;
  addBookmark: (bookmark: Bookmark) => void;
  getBookmark: (storySlug: string) => Bookmark | null;
}

const ReadingContext = createContext<ReadingContextType | null>(null);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ReadingPreferences>({
    fontSize: 16,
    darkMode: false,
  });
  
  const [bookmarks, setBookmarks] = useState<Record<string, Bookmark>>({});

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('reading-preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    const savedBookmarks = localStorage.getItem('reading-bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  const updatePreferences = (newPrefs: Partial<ReadingPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('reading-preferences', JSON.stringify(updated));
  };

  const addBookmark = (bookmark: Bookmark) => {
    const updated = { ...bookmarks, [bookmark.storySlug]: bookmark };
    setBookmarks(updated);
    localStorage.setItem('reading-bookmarks', JSON.stringify(updated));
  };

  const getBookmark = (storySlug: string): Bookmark | null => {
    return bookmarks[storySlug] || null;
  };

  return (
    <ReadingContext.Provider value={{
      preferences,
      updatePreferences,
      bookmarks,
      addBookmark,
      getBookmark,
    }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within ReadingProvider');
  }
  return context;
}