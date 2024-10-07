export interface Question {
  id: number;
  round_id: 1 | 2 | 3 | 4;
  name: string;
  answer_1: string;
  answer_2: string;
  answer_3: string | null;
  answer_4: string | null;
}

export interface Game {
  id: number;
  pin: string;
  players: Player[];
}

export interface GameData {
  pin: string;
  player: string;
}

export interface Player {
  id: number;
  username: string;
  points: number;
}

export interface Round {
  id: number;
  name: string;
}

export const Games: Game[] = [
  {
    id: 1,
    pin: "1VR3QX",
    players: [
      { id: 1, username: "Dona", points: 0 },
      { id: 2, username: "Sacha", points: 0 },
      { id: 3, username: "Tom", points: 0 },
      { id: 4, username: "Yo", points: 0 },
    ],
  },
];
// export const Rounds: Round[] = [
//   {
//     id: 1,
//     name: "Personnalité",
//   },
//   {
//     id: 2,
//     name: "Situations",
//   },
//   {
//     id: 3,
//     name: "Relations",
//   },
//   {
//     id: 4,
//     name: "Représentations",
//   },
// ];
