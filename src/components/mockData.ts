export interface Story {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: 'Ongoing' | 'Completed';
  rating: number;
  views: number;
  chapters: Chapter[];
  lastUpdated: string;
  featured: boolean;
}

export interface Chapter {
  id: string;
  slug: string;
  title: string;
  number: number;
  content: string;
  publishedAt: string;
  wordCount: number;
}

export const mockStories: Story[] = [
  {
    id: '1',
    slug: 'the-legendary-mechanic',
    title: 'The Legendary Mechanic',
    author: 'Qi Peijia',
    description: 'What do you do when you wake up and find yourself inside the very game that you love? Han Xiao was a professional power leveler before his transmigration. Using his past life\'s knowledge, Han Xiao sweeps through the universe as he prepares for the arrival of the players.',
    coverImage: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=600&fit=crop',
    genres: ['Sci-fi', 'Action', 'Adventure'],
    status: 'Ongoing',
    rating: 4.8,
    views: 2500000,
    lastUpdated: '2024-01-15',
    featured: true,
    chapters: [
      {
        id: '1-1',
        slug: 'chapter-1',
        title: 'Transmigration',
        number: 1,
        content: `The sound of gunfire echoed through the abandoned factory. Han Xiao crouched behind a rusted machine, his breathing steady despite the chaos around him.
        
        "System notification: Tutorial mission completed. Experience gained: 500 XP."
        
        Wait, what? Han Xiao's eyes widened as the familiar blue interface appeared in his vision. This was exactly like the game interface from Galaxy Online - the very game he'd been playing for years as a professional power leveler.
        
        But this wasn't a game anymore. The smell of gunpowder, the weight of the weapon in his hands, the pain from his injured shoulder - everything felt too real.
        
        "I've actually transmigrated into the game world," he whispered, a mix of excitement and disbelief in his voice.
        
        Han Xiao quickly accessed his character panel. Level 1, with basic stats and no special abilities yet. But he had something far more valuable than any starting equipment - complete knowledge of the game's future events, hidden quests, and optimal build paths.
        
        "If I'm really in Galaxy Online, then in about ten years, the players will arrive. The beta test hasn't even started yet," he thought, formulating his plans. "I have a decade to prepare and build my power base."
        
        The sound of approaching footsteps interrupted his thoughts. Three armed soldiers were closing in on his position. Han Xiao checked his ammunition - only five bullets left.
        
        "Time to put my game knowledge to the test," he muttered, raising his weapon.`,
        publishedAt: '2024-01-01',
        wordCount: 1250,
      },
      {
        id: '1-2',
        slug: 'chapter-2',
        title: 'First Steps',
        number: 2,
        content: `Han Xiao dispatched the three soldiers with precise headshots, each bullet finding its mark. His years of gaming experience translated surprisingly well to real combat.
        
        "Experience gained: 150 XP. Level up! You are now Level 2."
        
        The familiar level-up sound brought a smile to his face. He allocated his attribute points carefully - intelligence and luck were crucial for his planned build path.
        
        Searching the soldiers' bodies, he found additional ammunition, basic medical supplies, and most importantly, a communication device that would help him understand the current political situation.
        
        From the radio chatter, he learned he was on Planet Aquamarine, in the middle of a civil war between six nations. This was the starting zone for players who chose the mechanic class - his former specialty.
        
        "Perfect. I know exactly where to go and what to do," Han Xiao thought as he studied the factory around him. This was the infamous Crow Forest Base, a hidden facility that would become a major questline for mechanic players.
        
        But right now, it was just an abandoned weapons factory with valuable blueprint data waiting to be claimed.
        
        Han Xiao made his way deeper into the facility, avoiding the remaining guards. His destination was the main computer terminal in the research lab. If his memory served correctly, it contained the blueprints for several basic mechanical devices that would give him a significant head start.
        
        The lab door was locked with an electronic keypad. Han Xiao smiled - he remembered the code from his countless runs through this area as a player: 2157.
        
        The door clicked open, revealing a pristine research laboratory filled with computer terminals and mechanical prototypes.`,
        publishedAt: '2024-01-02',
        wordCount: 1180,
      },
      {
        id: '1-3',
        slug: 'chapter-3',
        title: 'The Blueprint Heist',
        number: 3,
        content: `The research lab was a treasure trove of mechanical knowledge. Han Xiao quickly located the main terminal and began downloading the blueprint data. His mechanic class abilities were still locked, but he could access basic crafting recipes.
        
        "Blueprint acquired: Basic Magnetic Ring. Blueprint acquired: Simple Mechanical Limb. Blueprint acquired: Energy Cell MK-1."
        
        These were exactly the items he needed to establish his initial power base. The Magnetic Ring could be sold to various factions for starting capital, while the mechanical limb would be essential for his future augmentations.
        
        As the download completed, alarms began blaring throughout the facility. Han Xiao had triggered the security system by accessing classified files. He had maybe five minutes before reinforcements arrived.
        
        Grabbing a toolbox and some raw materials from the lab, he made his way to the emergency exit. The weight of the stolen blueprints felt significant - not just physically, but symbolically. These would be the foundation of his rise to power.
        
        Outside the facility, Han Xiao found himself in the dense Crow Forest. He knew the area well from his gaming days - there was a safe house about two kilometers north, hidden in a cave system.
        
        The trek through the forest was treacherous, but Han Xiao navigated it with ease. His game knowledge made him aware of every hidden path and dangerous creature territory.
        
        Finally reaching the cave, he set up his first workshop. Using the Basic Magnetic Ring blueprint, he began crafting his first mechanical device. The process was slow and methodical, but each component he assembled brought him closer to his goals.
        
        "In the game, this would be just another starting quest," he reflected while working. "But now, every choice I make will shape this world's future. The players won't arrive for ten years, and by then, I'll be ready for them."`,
        publishedAt: '2024-01-03',
        wordCount: 1320,
      }
    ]
  },
  {
    id: '2',
    slug: 'martial-world',
    title: 'Martial World',
    author: 'Cocooned Cow',
    description: 'In the Realm of the Gods, countless legends fought over a mysterious cube. After the battle it disappeared into the void. Lin Ming stumbles upon this mystery object and begins his journey to become a hero of the land.',
    coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Martial Arts', 'Fantasy', 'Adventure'],
    status: 'Completed',
    rating: 4.6,
    views: 3200000,
    lastUpdated: '2023-12-20',
    featured: true,
    chapters: [
      {
        id: '2-1',
        slug: 'chapter-1',
        title: 'The Mysterious Cube',
        number: 1,
        content: `Lin Ming had always been considered a waste in the martial world. At seventeen years old, he had only reached the Body Transformation stage, while his peers had already advanced to Pulse Condensation or beyond.
        
        But today, everything would change.
        
        As he practiced his basic sword forms in the courtyard behind his family's modest house, something fell from the sky with a brilliant flash of light. The object crashed into the ground beside him, creating a small crater.
        
        Lin Ming approached cautiously. In the crater lay a small, perfectly geometric cube that seemed to absorb light rather than reflect it. Strange symbols pulsed along its surface with an otherworldly energy.
        
        The moment his fingers touched the cube, Lin Ming felt a surge of ancient power flow through his body. Visions flashed through his mind - countless warriors across different realms, all fighting desperately for possession of this very object.
        
        "The Primordial Chaos Cube," a voice echoed in his mind. "You have been chosen as its inheritor."
        
        Lin Ming gasped as knowledge flooded his consciousness. This cube was a legendary artifact from the God Realm, containing the memories and techniques of the greatest martial artists who had ever lived.
        
        With trembling hands, he lifted the cube. It was surprisingly light, and as he held it, he could feel his body's meridians being slowly restructured and strengthened.
        
        "This is my chance," Lin Ming whispered to himself. "My chance to change my destiny and become the martial artist I've always dreamed of being."
        
        The cube pulsed once more before seamlessly merging with his body, disappearing beneath his skin but leaving behind a warm sensation in his dantian.`,
        publishedAt: '2023-01-01',
        wordCount: 1100,
      }
    ]
  },
  {
    id: '3',
    slug: 'i-shall-seal-the-heavens',
    title: 'I Shall Seal the Heavens',
    author: 'Er Gen',
    description: 'What I want, the Heavens shall not lack! What I don\'t want, had better not exist in the Heavens! This is a story which originates between the Eighth and Ninth Mountains, the world in which the strong prey upon the weak.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
    genres: ['Xianxia', 'Fantasy', 'Adventure'],
    status: 'Completed',
    rating: 4.9,
    views: 4100000,
    lastUpdated: '2023-11-30',
    featured: true,
    chapters: [
      {
        id: '3-1',
        slug: 'chapter-1',
        title: 'The Scholar\'s Dream',
        number: 1,
        content: `Meng Hao sat in the dusty library of the Reliance Sect, surrounded by towers of ancient texts and scrolls. As an Outer Sect disciple, he spent most of his time copying manuscripts and organizing the sect's vast collection of cultivation manuals.
        
        But Meng Hao harbored no dreams of immortality or great power. Unlike his fellow disciples who dreamed of flying on swords and commanding the elements, he simply wanted to return home to take the Imperial examinations and become a scholar-official.
        
        "Cultivation is too dangerous," he muttered to himself as he carefully transcribed a text about pill refinement. "I'd rather live a long, peaceful life as a government official than risk death pursuing the Dao."
        
        His peaceful existence was shattered when Elder Brother Chen burst into the library, his robes torn and blood streaming from a wound on his arm.
        
        "Meng Hao! The sect is under attack! Patriarch Reliance has fallen into deep meditation and cannot wake up. The other sects have come to seize our mountain!"
        
        The sound of explosions echoed from outside, followed by the screams of disciples. Through the library windows, Meng Hao could see cultivators flying through the air on brilliant sword lights, their attacks carving deep gouges into the mountain itself.
        
        "But I don't know how to fight!" Meng Hao protested, clutching the manuscript to his chest.
        
        "Then you'll die like the rest of us," Chen replied grimly. "Unless... there might be one way."
        
        He pressed a jade slip into Meng Hao's trembling hands. "This contains the Sublime Spirit Scripture. It's incomplete and dangerous, but it might give you enough power to escape."
        
        As the library doors exploded inward and enemy cultivators poured in, Meng Hao made a decision that would change his destiny forever.`,
        publishedAt: '2023-01-01',
        wordCount: 1200,
      }
    ]
  },
  {
    id: '4',
    slug: 'against-the-gods',
    title: 'Against the Gods',
    author: 'Mars Gravity',
    description: 'Hunted for possessing a heaven-defying object, Yun Che is a young man in both that life and the next. Throwing himself off a cliff to spite his pursuers, Yun Che thinks that his life is over...',
    coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    genres: ['Xianxia', 'Romance', 'Adventure'],
    status: 'Ongoing',
    rating: 4.7,
    views: 3800000,
    lastUpdated: '2024-01-10',
    featured: false,
    chapters: []
  },
  {
    id: '5',
    slug: 'coiling-dragon',
    title: 'Coiling Dragon',
    author: 'I Eat Tomatoes',
    description: 'Empires rise and fall on the Yulan Continent. Saints, immortal beings of unimaginable power, battle using spells and sword techniques that can split mountains and destroy cities.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop',
    genres: ['Fantasy', 'Adventure', 'Magic'],
    status: 'Completed',
    rating: 4.8,
    views: 2900000,
    lastUpdated: '2023-10-15',
    featured: false,
    chapters: []
  }
];

export function getStoryBySlug(slug: string): Story | null {
  return mockStories.find(story => story.slug === slug) || null;
}

export function getChapterBySlug(storySlug: string, chapterSlug: string): Chapter | null {
  const story = getStoryBySlug(storySlug);
  if (!story) return null;
  
  return story.chapters.find(chapter => chapter.slug === chapterSlug) || null;
}

export function getFeaturedStories(): Story[] {
  return mockStories.filter(story => story.featured);
}

export function getLatestUpdates(): Story[] {
  return [...mockStories].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
}

export function getTopStoriesByViews(): Story[] {
  return [...mockStories].sort((a, b) => b.views - a.views);
}

export function getCompletedStories(): Story[] {
  return mockStories.filter(story => story.status === 'Completed');
}

export function searchStories(query: string): Story[] {
  const lowercaseQuery = query.toLowerCase();
  return mockStories.filter(story => 
    story.title.toLowerCase().includes(lowercaseQuery) ||
    story.author.toLowerCase().includes(lowercaseQuery) ||
    story.description.toLowerCase().includes(lowercaseQuery) ||
    story.genres.some(genre => genre.toLowerCase().includes(lowercaseQuery))
  );
}