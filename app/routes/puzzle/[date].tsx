import {
    findCardsForPuzzle,
    findCategoriesForPuzzle,
    findPuzzleByDate,
} from "../../db";
import { createRoute, DB } from "../../factory";
import Puzzle from "../../islands/Puzzle";

export const GET = createRoute((c) => {
    const { date } = c.req.param<"/:date">();

    const puzzle = findPuzzleByDate(DB, date);
    const cards = findCardsForPuzzle(DB, puzzle);
    const categories = findCategoriesForPuzzle(DB, puzzle);

    return c.render(
        <>
            <h1>Puzzle {puzzle.id}</h1>
            <h3>{puzzle.print_date}</h3>

            <form>
                <Puzzle puzzle={puzzle} cards={cards} categories={categories} />
                <input type="button" value="submit" />
            </form>
        </>,
    );
});

export default GET;
