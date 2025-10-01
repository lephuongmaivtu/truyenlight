// lib/api.ts
import { supabase } from "../supabaseClient";

// ================== Types ==================
export type StoryRow = {
  id: string;
  slug: string;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImage?: string | null; // app-level camelCase
  coverImage?: string | null; // DB snakeCase
  genres?: string[] | string | null;
  rating?: number | null;
  views?: number | null;
  status?: string | null;
  created_at?: string | null;
  lastUpdated?: string | null; // DB snakeCase
  lastUpdated?: string | null; // app-level camelCase
};

export type ChapterRow = {
  id: string;
  story_id: string;
  title: string;
  content: string;
  created_at: string | null;
  slug: string | null;
  number: number | null;
  word_count: number | null;
  published_at: string | null;
};

export type StoryWithChapters = StoryRow & {
  chapters: ChapterRow[];
};

export type ReadingProgress = {
  id: string;
  user_id: string;
  story_id: string;
  chapter_id: string;
  scroll_position: number;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  story_id: string;
  chapter_id: string | null;
  position?: number | null;
  updated_at?: string | null;
};

// ================== Helper ==================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ================== Stories ==================

export async function fetchComments(chapterId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles (username, avatar_url)
    `)
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
  return data;
}

export async function addComment(chapterId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert([{ chapter_id: chapterId, user_id: userId, content }])
    .select();

  if (error) {
    console.error("Error adding comment:", error);
    return null;
  }
  return data[0];
}


export async function fetchStoryWithChapters(
  slug: string
): Promise<StoryWithChapters | null> {
  const { data, error } = await supabase
    .from("stories")
    .select(`*, chapters(*)`)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("❌ fetchStoryWithChapters.error:", error);
    return null;
  }
  // đảm bảo có mảng chapters
  return { ...(data as any), chapters: (data as any).chapters ?? [] };
}

export async function fetchTopStories(
  limit = 5,
  excludeId?: string
): Promise<StoryRow[]> {
  let query = supabase
    .from("stories")
    .select("*")
    .order("views", { ascending: false })
    .limit(limit);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) {
    console.error("❌ fetchTopStories.error:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

export async function fetchStoryIdBySlug(
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("id")
    .eq("slug", slug)
    .single();
  if (error) {
    console.error("❌ fetchStoryIdBySlug.error:", error);
    return null;
  }
  return (data as any)?.id ?? null;
}

export async function fetchChaptersOfStory(
  storyId: string
): Promise<ChapterRow[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ fetchChaptersOfStory.error:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

export async function fetchChapterById(
  storyId: string,
  chapterId: string
): Promise<ChapterRow | null> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", storyId)
    .eq("id", chapterId)
    .single();

  if (error) {
    console.error("❌ fetchChapterById.error:", error);
    return null;
  }
  return data as any;
}

export async function fetchChapterBySlug(
  storyId: string,
  chapterSlug: string
): Promise<ChapterRow | null> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", storyId)
    .eq("slug", chapterSlug)
    .single();

  if (error) {
    console.error("❌ fetchChapterBySlug.error:", error);
    return null;
  }
  return data as any;
}

// ================== Write helpers ==================
export async function createChapterWithSlug(
  storyId: string,
  title: string,
  content: string
): Promise<ChapterRow | null> {
  const slug = slugify(title);
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

  const { data, error } = await supabase
    .from("chapters")
    .insert([
      {
        story_id: storyId,
        title,
        content,
        slug,
        number: null,
        word_count: wordCount,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ createChapterWithSlug.error:", error);
    return null;
  }
  return data as any;
}

// ================== Reading Progress ==================
export async function getReadingProgress(
  userId: string
): Promise<
  Array<
    ReadingProgress & {
      story: Pick<StoryRow, "id" | "slug" | "title" | "author" | "coverimage">;
    }
  >
> {
  // join alias: story:story_id(...)
  const { data, error } = await supabase
    .from("reading_progress")
    .select(
      `
      id,
      user_id,
      story_id,
      chapter_id,
      scroll_position,
      updated_at,
      story:story_id (
        id, slug, title, author, coverimage
      )
    `
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("❌ getReadingProgress.error:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

export async function updateReadingProgress(
  userId: string,
  storyId: string,
  chapterId: string,
  scrollPosition: number
): Promise<void> {
  const { error } = await supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: userId,
        story_id: storyId,
        chapter_id: chapterId,
        scroll_position: Math.max(0, Math.floor(scrollPosition ?? 0)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,story_id" }
    );

  if (error) {
    console.error("❌ updateReadingProgress.error:", error);
  }
}

// ================== Bookmarks ==================
/**
 * Dùng cho Profile – trả về danh sách Story đã bookmark (đã join story).
 * Giữ nguyên chữ ký: Promise<StoryRow[]>
 */
export async function fetchBookmarks(userId: string): Promise<StoryRow[]> {
  // alias story:story_id để chắc ăn dù FK không khai báo trong Supabase
  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      `
      story:story_id (
        id, slug, title, author, description, coverimage, rating, views, status, genres, lastupdated
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("❌ fetchBookmarks.error:", error);
    return [];
  }

  // map về StoryRow[]
  return ((data as any[]) ?? [])
    .map((row) => row.story)
    .filter(Boolean) as StoryRow[];
}

// Optional: thô (nếu cần nơi khác)
export async function getBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("❌ getBookmarks.error:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

// Lấy thống kê rating + vote của chính user
export async function fetchRatingStats(storyId: string, userId?: string) {
  const [{ data: stats }, { data: mine }] = await Promise.all([
    supabase
      .from("story_rating_stats")
      .select("avg_rating, rating_count")
      .eq("story_id", storyId)
      .maybeSingle(),
    userId
      ? supabase
          .from("story_ratings")
          .select("value")
          .eq("story_id", storyId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);

  return {
    avg: stats?.avg_rating ?? 0,
    count: stats?.rating_count ?? 0,
    mine: mine?.value ?? 0,
  };
}

export async function upsertUserRating(
  userId: string,
  storyId: string,
  value: number
) {
  const { error } = await supabase
    .from("story_ratings")
    .upsert(
      { user_id: userId, story_id: storyId, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,story_id" }
    );
  if (error) console.error("❌ upsertUserRating:", error);
}

