export enum PuzzleStatus {
    NotAttempted = 0,
    Attempted = 1,
    Solved = 2,
    New = 3,
}

export type PuzzleModel = {
    id: number;
    print_date: string;
    status: PuzzleStatus | null;
};

export type CategoryModel = {
    id: number;
    puzzle_id: number;
    difficulty: number;
    category: string;
    hint_card_id: number | null;
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
};

export type GameState = {
    puzzle: PuzzleModel;
    categories: CategoryModel[];
    cards: CardModel[];
};

export type PlayState = {
    guesses: GuessModel[];
};
