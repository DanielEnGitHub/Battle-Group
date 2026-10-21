export type GamePhase = 'lobby' | 'question' | 'results' | 'podium';

export interface Team {
  socketId: string;
  sessionId: string;
  name: string;
  score: number;
  totalTime: number;
  joinIndex: number;
}

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  img?: string;
  topic?: string;
}

export interface Quiz {
  id: string;
  name: string;
  questions: Question[];
  createdAt?: string;
}

export interface GameConfig {
  questionCount: number;
  timeLimit: number;
  totalPoints: number;
}

export interface GameStateSnapshot {
  phase: GamePhase;
  teams: Team[];
  quizName: string | null;
  totalQuestions: number;
  bankSize: number;
  currentQuestionIndex: number;
}

export interface ActiveQuestion {
  index: number;
  total: number;
  text: string;
  options: string[];   // players receive their own shuffled order
  img: string | null;
  timeLimit: number;
  timeLeftMs?: number;  // only on mid-question join/reconnect
  correctIndex?: number; // admin only
}

export interface AnswerResult {
  correct: boolean;
  points: number;
  timeMs: number;
  optionIndex?: number; // present on reconnect catch-up
}

export interface QuestionResults {
  correctIndex: number; // index in the receiver's own option order
  answers?: Array<{     // admin only
    teamName: string;
    correct: boolean;
    timeMs: number;
  }>;
}

export interface PodiumData {
  podium: Team[];
  standings?: Team[]; // full table, sent to the admin only
  stage: number;      // revealed steps: one per podium place (3rd → 1st), then a final step
  totalPoints: number;
}

export interface SessionData {
  teamName: string;
  sessionId: string;
}
