import { hc } from "hono/client";
import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./calendar";
import {
    addGameState,
    addGuess,
    getGameState,
    getGuess,
    getGuesses,
    INDEXED_DB,
    resetData,
} from "./db";
import type { AppType } from "./index";
import type { CardModel, CategoryModel, GameState } from "./models";
import { Puzzle as PuzzleElem } from "./puzzle";

const client = hc<AppType>("/");

const DB = INDEXED_DB;

function App() {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedCards, setSelectedCards] = useState<CardModel[]>([]);
    const [availableCards, setAvailableCards] = useState<CardModel[]>([]);
    const [guessedCategories, setGuessedCategories] = useState<CategoryModel[]>(
        [],
    );

    const initializeGame = async (gameState: GameState) => {
        setGameState(gameState);
        setSelectedCards([]);

        const categories: CategoryModel[] = [];
        let cards: CardModel[] = [...gameState.cards];

        const guesses = await getGuesses(DB, gameState.puzzle);
        guesses
            .filter(({ category_id }) => category_id)
            .forEach(({ category_id: guessCategoryId }) => {
                const guessedCategory = gameState.categories.find(
                    ({ id }) => guessCategoryId == id,
                );

                if (guessedCategory) {
                    categories.push(guessedCategory);
                    cards = [
                        ...cards.filter(
                            ({ category_id: id }) => guessCategoryId !== id,
                        ),
                    ];
                }
            });

        setGuessedCategories(categories);
        setAvailableCards(cards);
    };

    const tryGuess = async (_e: MouseEvent): Promise<void> => {
        if (!gameState || selectedCards.length !== 4) {
            return;
        }

        const guessStr = selectedCards
            .map((c) => c.id)
            .sort()
            .join(",");

        const alreadyGuessed = await getGuess(DB, gameState.puzzle, guessStr);
        if (alreadyGuessed) {
            console.error(
                `Already tried WRONG guess: puzzle=${gameState.puzzle.id} ${guessStr}`,
            );
            return;
        }

        const categoryId = selectedCards[0]?.category_id;
        const correctGuess = selectedCards.every(
            ({ category_id }) => categoryId == category_id,
        );

        if (!correctGuess) {
            console.error("INCORRECT");
            await addGuess(DB, gameState.puzzle, guessStr);
            return;
        }

        const guessedCategory = gameState.categories.find(
            ({ id }) => categoryId == id,
        );
        if (guessedCategory) {
            await addGuess(DB, gameState.puzzle, guessStr, categoryId);

            setGuessedCategories((categories) => [
                ...categories,
                guessedCategory,
            ]);
            setAvailableCards((cards) =>
                cards.filter((c) => !selectedCards.includes(c)),
            );
            setSelectedCards([]);
        }
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

    const date = new Date();
    return (
        <>
            <button type="button" onClick={() => resetData(DB)}>
                CLEAR THE DATA
            </button>

            <hr />

            <Calendar
                month={date.getMonth()}
                year={date.getFullYear()}
                selectDateFn={handleDateChange}
            />

            <hr />

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
