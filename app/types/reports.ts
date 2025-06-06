

import { ScoreData } from '../pages/dashboard/activities/[id]/components/interfaces'; // o el path correcto

export interface Score {
  id: string;
  student: {
    name: string;
  };
  score: number;
  feedback: string;
  completed: boolean;
}

export interface ActivityReport {
  moduleTitle: string;
  topicTitle: string;
  activityTitle: string;
  creatorName: string;
  scores: Score[];
}


export function createActivityReportDto(
  data: {
    moduleTitle: string;
    topicTitle: string;
    activityTitle: string;
    creatorName: string;
    scores: ScoreData[];
  }
): ActivityReport {
  const scores: Score[] = data.scores.map((s) => ({
    id: s.id,
    student: {
      name: s.student.name,
    },
    score: s.score,
    feedback: s.feedback,
    completed: s.completed,
  }));

  return {
    moduleTitle: data.moduleTitle,
    topicTitle: data.topicTitle,
    activityTitle: data.activityTitle,
    creatorName: data.creatorName,
    scores,
  };
}
