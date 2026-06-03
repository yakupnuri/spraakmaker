export const MOEDERTALEN = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "so", label: "Soomaali", flag: "🇸🇴" },
] as const;

export type MoedertaalCode = typeof MOEDERTALEN[number]["code"];

export interface FlashcardProgress {
  ease: number;
  interval: number;
  nextReview: string;
  correct: number;
  wrong: number;
}

export interface VerbProgress {
  correct: number;
  wrong: number;
  lastAttempt: string;
  weakForm: "imperfectum" | "perfectum" | null;
}

export interface LessonProgress {
  completed: boolean;
  score: number;
  stars: number;
  lastPractice: string;
}

export interface GameHistoryItem {
  sentence: string;
  translation: string;
  correct: boolean;
  timestamp: string;
  userAnswer?: string;
  explanation?: string;
}

export interface GameStats {
  playCount: number;
  correctCount: number;
  wrongCount: number;
  history: GameHistoryItem[];
}

export interface Progress {
  flashcard: Record<string, FlashcardProgress>;
  verbs: Record<string, VerbProgress>;
  lessons: Record<string, LessonProgress>;
  games: {
    highScores: {
      zinBouwen: number;
      vulIn: number;
      vertaal: number;
      snelronde: number;
      zinMotor: number;
    };
    totalPoints: number;
    streak: number;
    lastPlayDate: string;
    stats?: Record<string, GameStats>;
  };
  settings: {
    dailyGoal: number;
    theme: "light" | "dark" | "system";
  };
}

export interface Sentence {
  nl: string;
  tr: string;
}

export interface Lesson {
  id: string;
  title: string;
  sentences: Sentence[];
}

export interface Verb {
  infinitief: string;
  tr: string;
  en: string;
  type?: string;
  imperfectum_s: string;
  imperfectum_p: string;
  perfectum: string;
}

export interface Word {
  nl: string;
  tr: string;
  en?: string;
  chapter?: string;
}

export interface SignaalwoordCategory {
  category: string;
  category_tr: string;
  words: Array<{ nl: string; tr: string }>;
}
