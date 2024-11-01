export interface Question {
  id: number;
  round_id: 1 | 2 | 3 | 4;
  name: string;
  answer_1: string | null;
  answer_2: string | null;
  answer_3: string | null;
  answer_4: string | null;
}

export interface Game {
  id: number;
  pin: string;
  players: Player[];
  currentRound: Round | null;
  currentQuestion: Question | null;
  posedQuestions: number[];
  rightAnswer: string | null;
  allAnswered: boolean;
}

export interface GameData {
  pin: string;
  player: string;
}

export interface Player {
  id: number;
  username: string;
  points: number;
  hasAnswered: boolean;
  answer: string;
  isTurn: boolean;
  isRoundPlayer: boolean;
}

export interface Round {
  id: number;
  name: string;
}

export const emptyPlayer: Player = {
  id: 1,
  username: "",
  points: 0,
  hasAnswered: false,
  answer: "",
  isTurn: false,
  isRoundPlayer: false,
};
