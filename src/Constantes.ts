export interface Questions {
  id: number;
  round: 1 | 2 | 3 | 4;
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
export const Rounds: Round[] = [
  {
    id: 1,
    name: "Personnalité",
  },
  {
    id: 2,
    name: "Situations",
  },
  {
    id: 3,
    name: "Relations",
  },
  {
    id: 4,
    name: "Représentations",
  },
];
export const questions: Questions[] = [
  {
    id: 1,
    round: 1,
    name: "Vos vrais amis, vous les comptez ...",
    answer_1: "Sur les doigts d'une main",
    answer_2: "Sur les deux mains",
    answer_3: "Vous n'avez pas assez de doigts pour les compter",
    answer_4: "Vous n'en avez pas",
  },
  {
    id: 2,
    round: 1,
    name: "À quelle fréquence vous observez-vous à travers un miroir ou des photos ?",
    answer_1: "Plus souvent que la plupart des gens",
    answer_2: "Moins souvent que la plupart des gens",
    answer_3: null,
    answer_4: null,
  },
  {
    id: 3,
    round: 1,
    name: "Mentez-vous ?",
    answer_1: "Plus que la plupart des gens",
    answer_2: "Moins que la plupart des gens",
    answer_3: null,
    answer_4: null,
  },
];
