const PuzzleStatusEnum = {
  NotAttempted: 0,
  Attempted: 1,
  Solved: 2,
  Broken: 3,
} as const;

type PuzzleStatusEnum =
  (typeof PuzzleStatusEnum)[keyof typeof PuzzleStatusEnum];

export { PuzzleStatusEnum };

export type PuzzleModel = {
  id: number;
  print_date: string;
  status: PuzzleStatusEnum;
};

export type CategoryModel = {
  id: number;
  puzzle_id: number;
  difficulty: number;
  title: string;
};

export type CardModel = {
  id: number;
  puzzle_id: number;
  category_id: number;
  position: number;
  content: string;
};

export type GuessModel = {
  id: number;
  puzzle_id: number;
  guess: string;
  category_id: number | null;
};

export type GameState = {
  puzzle: PuzzleModel;
  categories: CategoryModel[];
  cards: CardModel[];
};

export type PlayState = {
  guesses: GuessModel[];
};
