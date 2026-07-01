import { create } from 'zustand';

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface ExerciseState {
  topic: string;
  level: string;
  count: number;
  questions: Question[];
  currentIdx: number;
  userAnswers: string[]; // options chosen by user (indexed by question index)
  elapsedSeconds: number;
  
  setSelections: (topic: string, level: string, count: number) => void;
  setQuestions: (questions: Question[]) => void;
  answerQuestion: (answer: string) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  setElapsedSeconds: (seconds: number) => void;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  topic: "",
  level: "",
  count: 10,
  questions: [],
  currentIdx: 0,
  userAnswers: [],
  elapsedSeconds: 0,
  
  setSelections: (topic, level, count) => set({ topic, level, count }),
  setQuestions: (questions) => set({ questions, currentIdx: 0, userAnswers: [], elapsedSeconds: 0 }),
  answerQuestion: (answer) => set((state) => {
    const newUserAnswers = [...state.userAnswers];
    newUserAnswers[state.currentIdx] = answer;
    return { userAnswers: newUserAnswers };
  }),
  nextQuestion: () => set((state) => ({ currentIdx: state.currentIdx + 1 })),
  resetQuiz: () => set({ currentIdx: 0, userAnswers: [], elapsedSeconds: 0 }),
  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
}));
