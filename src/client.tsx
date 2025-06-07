import { hc } from "hono/client";
import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./calendar";
import {
    addGameState,
    getGameState,
    getGuesses,
    INDEXED_DB,
    resetData,
    type CardModel,
    type CategoryModel,
    type GameState,
    type GuessModel,
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
    const [gameState, setGameState] = useState<GameState | null>(null);

    const [guesses, setGuesses] = useState<GuessModel[]>([]);
    const [selectedCards, setSelectedCards] = useState<CardModel[]>([]);
    const [availableCards, setAvailableCards] = useState<CardModel[]>([]);
    const [guessedCategories, setGuessedCategories] = useState<CategoryModel[]>(
        [],
    );

    const initializeGame = async (gameState: GameState) => {
        setGameState(gameState);

        setAvailableCards([...gameState.cards]);
        setGuesses([]);
        setSelectedCards([]);
        setGuessedCategories([]);

        const fetchedGuesses = await getGuesses(DB, gameState.puzzle);
        console.log(`fetched ${fetchedGuesses.length} guesses!`);
        fetchedGuesses.forEach(() => tryGuess);
    };

    const handleDateChange = async (date: string): Promise<void> => {
        setSelectedDate(date);

        let gameState = await getGameState(DB, date);
        if (gameState) {
            console.info("loading game state from indexeddb");
            await initializeGame(gameState);
            return;
        }

        const apiResponse = await client.api.puzzle[":date"].$get({
            param: { date },
        });
        if (!apiResponse.ok) {
            console.error(`API response no good... ${apiResponse}`);
            setGameState(null);
            return;
        }

        gameState = await apiResponse.json();
        if (!gameState) {
            console.error("Not a real puzzle...?");
            return;
        }
        if (!addGameState(DB, gameState)) {
            console.error("Failed to add puzzle. Look into this!");
        }

        await initializeGame(gameState);
    };

    // const toggleCard = (e: MouseEvent, card: CardModel): void => {
    const toggleCard =
        (card: CardModel) =>
        (e: MouseEvent): void => {
            const target = e.target as HTMLButtonElement;

            // console.log(
            //     selectedCards.map((c) => c.id),
            //     card.id,
            // );

            if (selectedCards.length < 4) {
                target.classList.add("selected");
                setSelectedCards([...selectedCards, card]);

                // setSelectedCards((cardz) => {
                //     console.log(`BEFORE SELZ: ${cardz.map((c) => c.id)}`);
                //     cardz = [...cardz, card];
                //     console.log(`AFTER SELZ: ${cardz.map((c) => c.id)}`);
                //     return cardz;
                // });
            } else if (selectedCards.includes(card)) {
                target.classList.remove("selected");
                setSelectedCards(selectedCards.filter((c) => c !== card));

                // setSelectedCards((cardz) => {
                //     console.log(`BEFORE SELZ: ${cardz.map((c) => c.id)}`);
                //     cardz = cardz.filter((c) => c !== card);
                //     console.log(`AFTER SELZ: ${cardz.map((c) => c.id)}`);
                //     return cardz;
                // });
            }
        };

    const tryGuess = (_e: MouseEvent): void => {
        if (!gameState || selectedCards.length !== 4) {
            console.log(
                `WILL NOT GUESS.  Num SelectedCards: ${selectedCards.length}`,
            );
            return;
        }

        const guessStr = selectedCards
            .map((c) => c.id)
            .sort()
            .join(",");
        if (guesses.map((g) => g.guess).includes(guessStr)) {
            console.error(`Already tried guess: ${guessStr}`);
            return;
        }

        // const guessModel = addGuess(selectedDate, guess);
        // setGuesses([...guesses, guess]);

        const categoryId = selectedCards[0]?.category_id ?? -10;
        const validGuess = selectedCards.every(
            ({ category_id }) => categoryId == category_id,
        );
        if (!validGuess) {
            return;
        }

        const guessedCategory =
            gameState.categories.find(({ id }) => id == categoryId) ?? null;

        if (!guessedCategory) {
            console.error(`Not a guessed category: ${guessedCategory}`);
            return;
        }

        // setAvailableCards((cardz) => {
        //     console.log(`BEFORE CARDZ: ${cardz.map((c) => c.id)}`);
        //     cardz = cardz.filter((c) => !selectedCards.includes(c));
        //     console.log(`AFTER CARDZ: ${cardz.map((c) => c.id)}`);
        //     return cardz;
        // });
        setAvailableCards(
            availableCards.filter((c) => !selectedCards.includes(c)),
        );
        // setGuessedCategories((catz) => {
        //     console.log(`BEFORE CATZ: ${catz.map((c) => c.id)}`);
        //     catz = [...catz, guessedCategory];
        //     console.log(`AFTER CATZ: ${catz.map((c) => c.id)}`);
        //     return catz;
        // });
        setGuessedCategories([...guessedCategories, guessedCategory]);
        // setSelectedCards((cardz) => {
        //     console.log(`BEFORE SELZ: ${cardz.map((c) => c.id)}`);
        //     cardz = cardz.filter(() => false);
        //     console.log(`AFTER SELZ: ${cardz.map((c) => c.id)}`);
        //     return cardz;
        // });
        setSelectedCards([]);

        console.log("GUESS COMPLETED!");
    };

    return (
        <>
            <button type="button" onClick={() => resetData(DB)}>
                CLEAR THE DATA
            </button>

            <Calendar
                month={date.getMonth()}
                year={date.getFullYear()}
                selectDateFn={handleDateChange}
            />

            <h3>{selectedDate}</h3>

            {gameState ? (
                <PuzzleElem
                    guessedCategories={guessedCategories}
                    availableCards={availableCards}
                    trySelectCard={toggleCard}
                    tryGuess={tryGuess}
                />
            ) : (
                <pre>no good</pre>
            )}
        </>
    );
}

const root = document.getElementById("root")!;
render(<App />, root);
