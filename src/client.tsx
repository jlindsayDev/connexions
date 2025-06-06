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

    const [selectedCards, setSelectedCards] = useState<number[]>([]);

    const handleDateChange = async (date: string): Promise<void> => {
        setSelectedDate(date);

        let puzz = await getPuzzle(DB, date);
        if (puzz) {
            setResponse(puzz);
            return;
        }

        const apiResponse = await client.api.puzzle[":date"].$get({
            param: { date },
        });

        if (!apiResponse.ok) {
            console.error(await apiResponse.json());
            setResponse(null);
            return;
        }

        puzz = await apiResponse.json();
        if (!puzz) {
            console.error("Not a real puzzle?");
        }

        const added = addPuzzle(puzz);
        if (!added) {
            console.error("failed to add puzzle. look into this!");
        }

        setResponse(puzz);
    };

    const toggleCard =
        (position: number) =>
        (e: MouseEvent): void => {
            const target = e.target as HTMLButtonElement;

            const filtered = selectedCards.filter((n) => n !== position);

            console.debug(
                selectedCards,
                position * (filtered.length !== selectedCards.length ? -1 : 1),
            );

            if (filtered.length !== selectedCards.length) {
                target?.classList.toggle("selected");
                setSelectedCards(filtered);
                return;
            }

            if (selectedCards.length >= 4) {
                return;
            }

            target?.classList.toggle("selected");
            setSelectedCards([...selectedCards, position]);
        };

    const puzz = response ? (
        <PuzzleElem
            guessedCategories={[]}
            availableCards={response.cards}
            trySelectCard={toggleCard}
            tryGuess={() => {}}
        />
    ) : (
        <></>
    );

    return (
        <>
            <Calendar
                month={date.getMonth()}
                year={date.getFullYear()}
                selectDateFn={handleDateChange}
            />

            <h3>{selectedDate}</h3>
            <pre>{response ? puzz : "no good"}</pre>
        </>
    );
}

const root = document.getElementById("root")!;
render(<App />, root);
