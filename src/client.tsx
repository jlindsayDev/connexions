import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./components/calendar";
import Puzzle from "./components/puzzle";
import * as db from "./db";
import type {
    CardModel,
    CategoryModel,
    GameState,
    PuzzleResponseModel,
} from "./models";
import { buttonGridClass, flexContainer, flexContainerItem } from "./styles";
import { requestNotifications } from "./utils";

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

        const guesses = await db.getGuesses(gameState.puzzle);
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

        const alreadyGuessed = await db.getGuess(gameState.puzzle, guessStr);
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
            await db.addGuess(gameState.puzzle, guessStr);
            return;
        }

        const guessedCategory = gameState.categories.find(
            ({ id }) => categoryId == id,
        );
        if (guessedCategory) {
            await db.addGuess(gameState.puzzle, guessStr, categoryId);

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

    const fetchGameState = async (date: string): Promise<GameState> => {
        const response = await fetch(`/puzzle/${date}`);
        const jsonData = (await response.json()) as PuzzleResponseModel;
        return db.addStateFromJson(jsonData);
    };

    const handleDateChange = (date: string) => async (_e: MouseEvent) => {
        let gameState = await db.getGameState(date);
        if (gameState) {
            await initializeGame(gameState);
            return true;
        }

        try {
            gameState = await fetchGameState(date);
            await initializeGame(gameState);
            return true;
        } catch (e) {
            console.error(`COULD NOT INITILIZE GAME FOR DATE ${date}: ${e}`);
            setGameState(null);
            return false;
        }
    };

    const tryToggleCard =
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
        <div class={flexContainer}>
            <div class={flexContainerItem}>
                <Calendar
                    month={date.getMonth()}
                    year={date.getFullYear()}
                    selectDateFn={handleDateChange}
                />

                <div class={buttonGridClass}>
                    <button type="button" onClick={() => db.resetData()}>
                        CLEAR THE DATA
                    </button>

                    <button type="button" onClick={() => db.exportData()}>
                        EXPORT THE DATA
                    </button>

                    {Notification?.permission !== "granted" && (
                        <button type="button" onClick={requestNotifications}>
                            NOTIFICATIONS
                        </button>
                    )}
                </div>
            </div>

            {gameState && (
                <div class={flexContainerItem}>
                    <Puzzle
                        guessedCategories={guessedCategories}
                        availableCards={availableCards}
                        selectCardFn={tryToggleCard}
                        guessFn={tryGuess}
                    />
                </div>
            )}
        </div>
    );
}

const root = document.getElementById("root")!;
render(<App />, root);
