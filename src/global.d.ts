declare module "models" {
    export type Puzzle = {
        id: number;
        print_date: string;
        nyt_id: number | null;
        difficulty: number | null;
    };

    export type Category = {
        id: number;
        puzzle_id: number;
        difficulty: number;
        category: string;
        hint_card_id: number | null;
    };

    export type Card = {
        id: number;
        puzzle_id: number;
        category_id: number;
        position: number;
        content: string;
    };
}
