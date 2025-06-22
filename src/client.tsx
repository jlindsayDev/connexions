import { hc } from "hono/client";
import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./components/calendar";
import Puzzle from "./components/puzzle";
import {
    addGameState,
    addGuess,
    exportData,
    getGameState,
    getGuess,
    getGuesses,
    INDEXED_DB,
    resetData,
} from "./db";
import { requestNotificationPermission } from "./features";
import type { AppType } from "./index";
import type { CardModel, CategoryModel, GameState } from "./models";
import type { ServiceWorkerType } from "./sw";

const client = hc<AppType>("/");
const sw = hc<ServiceWorkerType>("/sw");

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

    const tryGuess = async (_e: UIEvent): Promise<void> => {
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

            <button type="button" onClick={() => exportData(DB)}>
                EXPORT THE DATA
            </button>

            <button type="button" onClick={requestNotificationPermission}>
                NOTIFICATIONS
            </button>

            <button type="button" onClick={() => {}}>
                SOMETHING
            </button>

            <hr />

            <Calendar
                month={date.getMonth()}
                year={date.getFullYear()}
                selectDateFn={handleDateChange}
            />

            <hr />

            {gameState ? (
                <Puzzle
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

const startServiceWorkerRegistration = async () => {
    if (!import.meta.env["PROD"]) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            console.log(`Unregistering Service Worker: ${registration}`);
            registration.unregister();
        }
    }

    console.log("Registering new service worker");
    await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        type: "module",
    });
};

if ("serviceWorker" in navigator) {
    window.addEventListener("load", startServiceWorkerRegistration);
}
