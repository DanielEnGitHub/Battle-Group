export type GamePhase = 'lobby' | 'question' | 'results' | 'podium';

export interface Team {
  socketId: string;
  sessionId: string;
  name: string;
  score: number;
  totalTime: number;
  joinIndex: number;  // orden de registro — define el carril, nunca cambia
  rank?: number;
  progress?: number;
}

export interface Question {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  timeLimit: number;
}

export interface Quiz {
  id: string;
  name: string;
  questions: Question[];
  createdAt?: string;
}

export interface GameStateSnapshot {
  phase: GamePhase;
  teams: Team[];
  quizName: string | null;
  totalQuestions: number;
  currentQuestionIndex: number;
}

export interface ActiveQuestion {
  index: number;
  total: number;
  text: string;
  options: string[];
  timeLimit: number;
  correctIndex?: number; // Solo para admin
}

export interface AnswerResult {
  correct: boolean;
  points: number;
  timeMs: number;
}

export interface QuestionResults {
  correctIndex: number;
  answers: Array<{
    teamName: string;
    correct: boolean;
    timeMs: number;
  }>;
  leaderboard: Team[];
}

export interface PodiumData {
  podium: Team[];
  all: Team[];
}

export interface SessionData {
  teamName: string;
  sessionId: string;
}
