export enum PuzzleStatus {
    NotAttempted = 0,
    Attempted = 1,
    Solved = 2,
}

export type PuzzleResponseModel = {
    status: string;
    id: number;
    print_date: string;
    categories: [
        {
            title: string;
            cards: [
                {
                    content: string;
                    position: number;
                },
            ];
        },
    ];
};

export type PuzzleModel = {
    id: number;
    print_date: string;
    status: PuzzleStatus;
};

export type CategoryModel = {
    id: number;
    puzzle_id: number;
    difficulty: number;
    category: string;
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
