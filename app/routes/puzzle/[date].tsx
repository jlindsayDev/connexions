import { createRoute, DB } from "../../factory";
import {
    findCardsForPuzzle,
    findCategoriesForPuzzle,
    findPuzzleByDate,
} from "../../features/sqlite_db";
import Puzzle from "../../islands/puzzle";

export const GET = createRoute((c) => {
    const { date } = c.req.param<"/:date">();

    const dateObj = new Date(date);
    const prevDateStr = new Date(dateObj.setDate(dateObj.getDate() - 1))
        .toISOString()
        .substring(0, 10);
    const nextDateStr = new Date(dateObj.setDate(dateObj.getDate() + 2))
        .toISOString()
        .substring(0, 10);

    const puzzle = findPuzzleByDate(DB, date);
    const cards = findCardsForPuzzle(DB, puzzle);
    const categories = findCategoriesForPuzzle(DB, puzzle);

    return c.render(
        <>
            <h1>Puzzle {puzzle.id}</h1>

            <nav>
                <a href={`/puzzle/${prevDateStr}`} rel="prev">
                    &larr;
                </a>

                <span class="date">{puzzle.print_date}</span>

                <a href={`/puzzle/${nextDateStr}`} rel="next">
                    &rarr;
                </a>
            </nav>

            <Puzzle
                date={puzzle.print_date}
                guesses={[]}
                cards={cards}
                categories={categories}
            />
        </>,
    );
});

export default GET;
