import { hc } from "hono/client";
import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./calendar";
import {
    addPuzzle,
    getPuzzle,
    INDEXED_DB,
    type Puzzle as PuzzleType,
} from "./db";
import type { AppType } from "./index";
import { Puzzle as PuzzleElem } from "./puzzle";

const client = hc<AppType>("/");

const DB = INDEXED_DB;

function App() {
    const date = new Date();

    const yearStr = date.getFullYear().toString();
    const monthStr = (date.getMonth() + 1).toString().padStart(2, "0");
    const dayStr = date.getDate().toString().padStart(2, "0");
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const [selectedDate, setSelectedDate] = useState<string>(dateStr);
    const [response, setResponse] = useState<PuzzleType | null>(null);

    const handleDateChange = async (date: string): Promise<void> => {
        setSelectedDate(date);

        const puzz = await getPuzzle(DB, date);
        if (puzz) {
            const { puzzle, cards, categories } = puzz;
            setResponse(
                [
                    { puzzle: puzzle.id },
                    { cards: cards.map((c) => c.content) },
                    { categories: categories.map((c) => c.id) },
                ].join(",\n"),
            );
            return;
        }

        const apiResponse = await client.api.puzzle[":date"].$get({
            param: { date },
        });

        if (!apiResponse.ok) {
            // const errorMessage = await apiResponse.json();
            // console.error(errorMessage.message);
            setResponse(null);
            return;
        }

        const { puzzle, cards, categories } = await apiResponse.json();
        const added = addPuzzle({ puzzle, cards, categories });
        if (!added) {
            console.error("failed to add puzzle. look into this!");
        }

        setResponse(
            [
                puzzle.id,
                cards.map((c) => c.position),
                categories.map((c) => c.difficulty),
            ].join(",\n"),
        );
    };

    return (
        <>
            <Calendar
                month={date.getMonth()}
                year={date.getFullYear()}
                selectDateFn={handleDateChange}
            />

            <h3>{selectedDate}</h3>
            <pre>{response ? response : "no good"}</pre>

            <PuzzleElem
                guessedCategories={[]}
                availableCards={[]}
                trySelectCard={() => {}}
                tryGuess={() => {}}
            />
        </>
    );
}

const root = document.getElementById("root")!;
render(<App />, root);
