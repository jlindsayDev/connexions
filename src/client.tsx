import { hc } from "hono/client";
import { type FC, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./components/calendar";
import Puzzle from "./components/puzzle";
import * as db from "./db";
import type { ApiRoutes } from "./index";
import type * as models from "./models";
import { buttonGridClass, flexContainer, flexContainerItem } from "./styles";
import { requestNotifications } from "./utils";

const fetchGameState = async (date: string): Promise<models.GameState> => {
    const client = hc<ApiRoutes>("/");
    const response = await client.puzzle[":date"].$get({ param: { date } });
    const jsonData = (await response.json()) as models.PuzzleResponseModel;
    return db.addStateFromJson(jsonData);
};

const fetchGameStream = async ({
    year,
    month,
}: {
    year: string;
    month: string;
}) => {
    const client = hc<ApiRoutes>("/");
    const response = await client.calendar[":year"][":month"].$get({
        param: { year, month },
    });

    ((await response.json()) as models.GameState[]).forEach(db.addGameState);
};

const fetchDaysDownloaded = async (date: Date) =>
    await db.daysDownloaded(date.getFullYear(), date.getMonth());

const helperButtons = (
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

        <button
            type="button"
            onClick={() => fetchGameStream({ year: "2025", month: "06" })}
        >
            IMPORT FROM DB (BETA)
        </button>
    </div>
);

type AppProps = {
    startDate: Date;
    startDays: Set<number>;
};

const App: FC<AppProps> = ({ startDate, startDays }: AppProps) => {
    // Calendar State
    const [date, setDate] = useState<Date>(startDate);
    const [days, setDays] = useState<Set<number>>(startDays);

    // Puzzle State
    const [gameState, setGameState] = useState<models.GameState | null>(null);
    const [selectedCards, setSelectedCards] = useState<models.CardModel[]>([]);
    const [availableCards, setAvailableCards] = useState<models.CardModel[]>(
        [],
    );
    const [guessedCategories, setGuessedCategories] = useState<
        models.CategoryModel[]
    >([]);

    // Calendar Functions
    const handleMonthChange = (offset: number) => async (_e: Event) => {
        const calendarDate = new Date(date.setMonth(date.getMonth() + offset));
        setDate(calendarDate);
        setDays(await fetchDaysDownloaded(calendarDate));
    };

    const handleDateChange = (date: string) => async (_e: Event) => {
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

    // Puzzle Functions
    const initializeGame = async (gameState: models.GameState) => {
        setGameState(gameState);
        setSelectedCards([]);

        const categories: models.CategoryModel[] = [];
        let cards: models.CardModel[] = [...gameState.cards];

        (await db.getGuesses(gameState.puzzle))
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

    const tryToggleCard =
        (card: models.CardModel) =>
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

    return (
        <div class={flexContainer}>
            <div class={flexContainerItem}>
                <Calendar
                    date={date}
                    downloaded={days}
                    moveMonth={handleMonthChange}
                    selectDateFn={handleDateChange}
                />
                {helperButtons}
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
};

const startDate = new Date();
const startDays = await fetchDaysDownloaded(startDate);
render(
    <App startDate={startDate} startDays={startDays} />,
    document.getElementById("root")!,
);
