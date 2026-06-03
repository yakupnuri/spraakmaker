"use client";

import { useState, useEffect, useCallback } from "react";
import type { Progress, MoedertaalCode } from "./types";

const DEFAULT_PROGRESS: Progress = {
  flashcard: {},
  verbs: {},
  lessons: {},
  games: {
    highScores: { zinBouwen: 0, vulIn: 0, vertaal: 0, snelronde: 0, zinMotor: 0 },
    totalPoints: 0,
    streak: 0,
    lastPlayDate: "",
    stats: {
      zinBouwen: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
      zinMotor: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
      vertaal: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
      snelronde: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] },
      vulIn: { playCount: 0, correctCount: 0, wrongCount: 0, history: [] }
    }
  },
  settings: {
    dailyGoal: 15,
    theme: "system",
    uiStyle: "modern",
  },
};

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spraakmaker-progress");
      if (stored) {
        setProgress({ ...DEFAULT_PROGRESS, ...JSON.parse(stored) });
      }
    } catch {}
  }, []);

  const updateProgress = useCallback((updater: (prev: Progress) => Progress) => {
    setProgress((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("spraakmaker-progress", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { progress, updateProgress };
}

export function useMoedertaal() {
  const [moedertaal, setMoedertaalState] = useState<MoedertaalCode>("tr");

  useEffect(() => {
    const stored = localStorage.getItem("spraakmaker-moedertaal") as MoedertaalCode | null;
    if (stored) setMoedertaalState(stored);
  }, []);

  const setMoedertaal = useCallback((code: MoedertaalCode) => {
    setMoedertaalState(code);
    localStorage.setItem("spraakmaker-moedertaal", code);
  }, []);

  // Returns translation from an object that has "tr" field as fallback
  const translate = useCallback(
    (item: any) => {
      return item[moedertaal] ?? item["tr"] ?? "";
    },
    [moedertaal]
  );

  return { moedertaal, setMoedertaal, translate };
}

export function useOnboarding() {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("spraakmaker-onboarding");
    setDone(stored === "done");
  }, []);

  const markDone = useCallback(() => {
    localStorage.setItem("spraakmaker-onboarding", "done");
    setDone(true);
  }, []);

  return { onboardingDone: done, markDone };
}

export function useTimer(initialSeconds: number, onEnd?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      onEnd?.();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds, onEnd]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setRunning(true);
  }, [initialSeconds]);

  const stop = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return { seconds, running, start, stop, reset };
}

// SM-2 Spaced Repetition
export function useSpacedRepetition() {
  const sm2 = useCallback(
    (
      ease: number,
      interval: number,
      quality: 0 | 1 | 2 | 3 | 4 | 5
    ): { ease: number; interval: number; nextReview: string } => {
      let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newEase < 1.3) newEase = 1.3;

      let newInterval: number;
      if (quality < 3) {
        newInterval = 1;
      } else if (interval <= 1) {
        newInterval = 1;
      } else if (interval === 6) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEase);
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);

      return {
        ease: newEase,
        interval: newInterval,
        nextReview: nextReview.toISOString(),
      };
    },
    []
  );

  return { sm2 };
}

// Levenshtein distance for typo tolerance
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
