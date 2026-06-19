export const MOEDERTALEN = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷", available: true },
  { code: "ar", label: "العربية", flag: "🇸🇦", available: false },
  { code: "uk", label: "Українська", flag: "🇺🇦", available: false },
  { code: "en", label: "English", flag: "🇬🇧", available: false },
  { code: "fa", label: "فارسی", flag: "🇮🇷", available: false },
  { code: "pl", label: "Polski", flag: "🇵🇱", available: false },
  { code: "es", label: "Español", flag: "🇪🇸", available: false },
  { code: "fr", label: "Français", flag: "🇫🇷", available: false },
  { code: "so", label: "Soomaali", flag: "🇸🇴", available: false },
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
  curriculum?: CurriculumProgress;
  games: {
    highScores: {
      zinBouwen: number;
      vulIn: number;
      vertaal: number;
      snelronde: number;
      zinMotor: number;
      flitsen: number;
    };
    totalPoints: number;
    streak: number;
    lastPlayDate: string;
    daily?: { date: string; count: number };
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

export type LesType = "verhaal" | "grammatica_spreken";

export interface CurriculumLes {
  nr: number;
  type: LesType;
  titel: string;
  verhaalId?: string;
  grammarTopic?: string;
  zinnenbankLesId?: string;
  niveau?: string;
}

export interface Etappe {
  id: string;
  niveau: string;
  titel: string;
  volgorde: number;
  lessen: CurriculumLes[];
}

export interface EtappeProgress {
  lessenDone: string[];
  quizPassed: boolean;
}

export interface CurriculumProgress {
  activeEtappeId: string;
  etappes: Record<string, EtappeProgress>;
}
