import { hc } from "hono/client";
import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import type { Card, Category, Puzzle } from "models";
import Calendar from "./components/calendar";
import { Puzzle as PuzzleElem } from "./components/puzzle";
import type { AppType } from "./index";

const client = hc<AppType>("/");

function App() {
    const date = new Date();

    const yearStr = date.getFullYear().toString();
    const monthStr = (date.getMonth() + 1).toString().padStart(2, "0");
    const dayStr = date.getDate().toString().padStart(2, "0");
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const [selectedDate, setSelectedDate] = useState<string>(dateStr);
    const [response, setResponse] = useState<
        (Puzzle & Card[] & Category[]) | null
    >(null);

    const handleDateChange = async (date: string): Promise<void> => {
        setSelectedDate(date);

        const apiResponse = await client.api.puzzle[":date"].$get({
            param: { date },
        });

        if (!apiResponse.ok) {
            setResponse("No good");
            return;
        }

        const { puzzle, cards, categories } = await apiResponse.json();

        setResponse(
            [
                puzzle.id,
                cards.map((c) => c.position),
                categories.map((c) => c.difficulty),
            ].join(",\n"),
        );

        // if date exists in IndexedDB, load puzzle

        // if not, fetch from API
    };

    return (
        <>
            <Calendar
                month={date.getMonth()}
                year={date.getFullYear()}
                selectDateFn={handleDateChange}
            />
            <h3>{selectedDate}</h3>
            {response && <pre>{response}</pre>}
            <PuzzleElem
                date={selectedDate}
                guesses={[]}
                cards={[]}
                categories={[]}
            />
        </>
    );
}

// const ClockButton = () => {
//     const [response, setResponse] = useState<string | null>(null);

//     const handleClick = async () => {
//         const response = await client.api.clock.$get();
//         const data = await response.json();
//         const headers = Array.from(response.headers.entries()).reduce<
//             Record<string, string>
//         >((acc, [key, value]) => {
//             acc[key] = value;
//             return acc;
//         }, {});
//         const fullResponse = {
//             url: response.url,
//             status: response.status,
//             headers,
//             body: data,
//         };
//         setResponse(JSON.stringify(fullResponse, null, 2));
//     };

//     return (
//         <div>
//             <button type="button" onClick={handleClick}>
//                 Get Server Time
//             </button>
//             {response && <pre>{response}</pre>}
//         </div>
//     );
// };

const root = document.getElementById("root")!;
render(<App />, root);
