import { hc } from "hono/client";
import { type FC, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./components/calendar";
import Puzzle from "./components/puzzle";
import * as db from "./db";
import type { ApiRoutes } from "./index";
import type * as models from "./models";
import { buttonGridClass, flexContainer, flexContainerItem } from "./styles";
import { pad, requestNotifications } from "./utils";

const fetchDaysDownloaded = async (date: Date) =>
    await db.daysDownloaded(date.getFullYear(), date.getMonth());

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
        const gameState = await db.getGameState({ print_date: date });
        if (gameState) {
            await initializeGame(gameState);
            return true;
        }

        try {
            const response = await hc<ApiRoutes>("/").puzzle[":date"].$get({
                param: { date },
            });
            const minGameState = (await response.json()) as models.GameState;
            const puzzle_id = await db.addGameState(minGameState);

            const day = Number.parseInt(date.substring(8));
            setDays(new Set([...days, day]));

            const gameState = (await db.getGameState({ puzzle_id }))!;
            await initializeGame(gameState);
            return true;
        } catch (e) {
            console.error(`COULD NOT INITILIZE GAME FOR DATE ${date}`);
            setGameState(null);
            throw e;
        }
    };

    const importGameStream = async ({
        year,
        month,
    }: {
        year: number;
        month: number;
    }) => {
        const apiRoute = hc<ApiRoutes>("/").calendar[":year"][":month"];
        const response = await apiRoute.$get({
            param: { year: year.toString(), month: pad(month + 1) },
        });
        const games = (await response.json()) as models.GameState[];
        const gamePromises = games.map(async (game) => {
            await db.addGameState(game);
            return Number.parseInt(game.puzzle.print_date.substring(8));
        });
        const newDays = await Promise.all(gamePromises);
        setDays(new Set([...days, ...newDays]));
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

        const categoryId = selectedCards[0]!.category_id;
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
                        onClick={() =>
                            importGameStream({
                                year: date.getFullYear(),
                                month: date.getMonth(),
                            })
                        }
                    >
                        IMPORT FROM DB
                    </button>
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
};

const startDate = new Date();
render(
    <App
        startDate={startDate}
        startDays={await fetchDaysDownloaded(startDate)}
    />,
    document.getElementById("root")!,
);
