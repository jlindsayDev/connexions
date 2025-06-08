import { hc } from "hono/client";
import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./calendar";
import {
    addGameState,
    addGuess,
    getGameState,
    getGuesses,
    INDEXED_DB,
    resetData,
} from "./db";
import type { AppType } from "./index";
import type { CardModel, CategoryModel, GameState, GuessModel } from "./models";
import { Puzzle as PuzzleElem } from "./puzzle";

const client = hc<AppType>("/");

const DB = INDEXED_DB;

function App() {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [guesses, setGuesses] = useState<GuessModel[]>([]);
    const [selectedCards, setSelectedCards] = useState<CardModel[]>([]);
    const [availableCards, setAvailableCards] = useState<CardModel[]>([]);
    const [guessedCategories, setGuessedCategories] = useState<CategoryModel[]>(
        [],
    );

    const initializeGame = async (gameState: GameState) => {
        setGameState(gameState);

        setSelectedCards([]);
        setAvailableCards([...gameState.cards]);

        setGuesses([]);
        setGuessedCategories([]);
        (await getGuesses(DB, gameState.puzzle)).forEach(doGuess);
    };

    const handleDateChange = (date: string) => async (_e: MouseEvent) => {
        let gameState = await getGameState(DB, date);
        if (gameState) {
            await initializeGame(gameState);
            return;
        }

        const apiResponse = await client.api.puzzle[":date"].$get({
            param: { date },
        });
        if (!apiResponse.ok) {
            setGameState(null);
            return;
        }

        gameState = await apiResponse.json();
        if (gameState) {
            await addGameState(DB, gameState);
            await initializeGame(gameState);
        }
    };

    const toggleCard =
        (card: CardModel) =>
        (e: MouseEvent): void => {
            const target = e.target as HTMLButtonElement;

            if (selectedCards.includes(card)) {
                target.classList.remove("selected");
                setSelectedCards(selectedCards.filter((c) => c !== card));
            } else if (selectedCards.length < 4) {
                target.classList.add("selected");
                setSelectedCards([...selectedCards, card]);
            }
        };

    const tryGuess = async (_e: MouseEvent): Promise<void> => {
        if (!gameState || selectedCards.length !== 4) {
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
        const guess = await addGuess(DB, gameState.puzzle, guessStr);
        doGuess(guess);
    };

    const doGuess = (guess: GuessModel) => {
        if (!gameState) {
            return;
        }

        setGuesses([...guesses, guess]);

        const categoryId = selectedCards[0]?.category_id;
        const validGuess = selectedCards.every(
            ({ category_id }) => categoryId == category_id,
        );
        if (!validGuess) {
            return;
        }

        const guessedCategory = gameState.categories.find(
            ({ id }) => id == categoryId,
        );
        if (!guessedCategory) {
            return;
        }

        setAvailableCards(
            availableCards.filter((c) => !selectedCards.includes(c)),
        );
        setGuessedCategories([...guessedCategories, guessedCategory]);
        setSelectedCards([]);
    };

    const date = new Date();
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

            {gameState ? (
                <PuzzleElem
                    guessedCategories={guessedCategories}
                    availableCards={availableCards}
                    trySelectCard={toggleCard}
                    tryGuess={tryGuess}
                />
            ) : (
                <></>
            )}
        </>
    );
}

const root = document.getElementById("root")!;
render(<App />, root);
