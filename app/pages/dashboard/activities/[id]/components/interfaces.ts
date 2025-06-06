import { ActivityType, DifficultyLevel } from "@prisma/client";

export interface ActivityWithWordSearchConfig {
  id: string;
  title: string;
  type: 'WORD_SEARCH' | string; // Puedes extender esto con más tipos si deseas
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
  config: JSON;
  points: number;
  timeLimit: number;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
  topicId: string;
  createdById: string;
  topic: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | string;
  };
}


export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  difficulty: DifficultyLevel;
  config: any;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  createdById: string;
}

export interface ProgressData {
  studentId: string;
  activityId: string;
  score?: number;
  completed?: boolean;
  timeSpent?: number;
  attempts?: number;
  lastAttempt?: Date;
  feedback?: string;
}

export interface GameState {
  score: number;
  completed: boolean;
  [key: string]: any;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface ScoreData {
  feedback: string;
  completed: boolean;
  id: string;
  score: number;
  student: Student;
}
