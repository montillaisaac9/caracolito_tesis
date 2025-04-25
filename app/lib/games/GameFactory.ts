import { ActivityType, DifficultyLevel } from "@prisma/client";
import { WordSearchGame } from "./WordSearchGame";
import { MatchingGame } from "./MatchingGame";
import { GameBase } from "./abstract/GameBase";

interface Activity {
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

export class GameFactory {
  static createGame(activity: Activity): GameBase {
    switch(activity.type) {
      case 'WORD_SEARCH':
        return new WordSearchGame(activity);
      case 'MATCHING':
        return new MatchingGame(activity);
      default:
        throw new Error(`Tipo de juego no soportado: ${activity.type}`);
    }
  }
}