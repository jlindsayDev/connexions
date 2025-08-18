import { hc } from "hono/client";
import { type FC, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Calendar from "./components/calendar";
import Puzzle from "./components/puzzle";
import * as db from "./db";
import type { ApiRoutes } from "./index";
import * as models from "./models";
import { pad, requestNotifications } from "./utils";

const fetchDaysDownloaded = async (date: Date) =>
    await db.daysDownloaded(date.getFullYear(), date.getMonth());

type AppProps = {
    startDate: Date;
    startDays: Map<number, models.PuzzleStatus>;
};

const App: FC<AppProps> = ({ startDate, startDays }: AppProps) => {
    // Calendar State
    const [date, setDate] = useState<Date>(startDate);
    const [days, setDays] =
        useState<Map<number, models.PuzzleStatus>>(startDays);

    // Puzzle State
    const [gameState, setGameState] = useState<models.GameState | null>(null);
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

            const day = new Map<number, number>().set(
                Number.parseInt(date.substring(8)),
                models.PuzzleStatus.NotAttempted,
            );
            setDays({ ...days, ...day });

            const gameState = (await db.getGameState({ puzzle_id }))!;
            await initializeGame(gameState);
        } catch (e) {
            console.error(`COULD NOT INITILIZE GAME FOR DATE ${date}`);
            reset();
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
            return [
                Number.parseInt(game.puzzle.print_date.substring(8)),
                game.puzzle.status,
            ];
        });
        const newDays = Object.fromEntries(
            await Promise.all(gamePromises),
        ).toArray();
        setDays({ ...days, ...newDays });
    };

    // Puzzle Functions
    const initializeGame = async (gameState: models.GameState) => {
        setGameState(gameState);

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

    const tryGuess = async (formData: FormData): Promise<void> => {
        const cardPositions = (formData.getAll("cards") as string[]).map((c) =>
            Number.parseInt(c, 10),
        );
        if (!gameState || cardPositions.length !== 4) {
            return;
        }

        const guessStr = cardPositions.sort().join(",");

        const alreadyGuessed = await db.getGuess(gameState.puzzle, guessStr);
        if (alreadyGuessed) {
            console.error(
                `Already tried WRONG guess: puzzle=${gameState.puzzle.id} ${guessStr}`,
            );
            return;
        }

        const selectedCards = gameState.cards.filter(({ position }) =>
            cardPositions.includes(position),
        );
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
        }
    };

    const reset = () => {
        setAvailableCards([]);
        setGameState(null);
    };

    return (
        <>
            <header>CONNEXIONS</header>

            {gameState ? (
                <Puzzle
                    printDate={gameState.puzzle.print_date}
                    guessedCategories={guessedCategories}
                    availableCards={availableCards}
                    guessFn={tryGuess}
                    reset={reset}
                />
            ) : (
                <Calendar
                    date={date}
                    downloaded={days}
                    moveMonth={handleMonthChange}
                    selectDateFn={handleDateChange}
                />
            )}

            <footer>
                <button type="button" onClick={() => db.resetData()}>
                    CLEAR THE DATA
                </button>

                <button type="button" onClick={() => db.exportData()}>
                    EXPORT THE DATA
                </button>

                <button type="button" onClick={requestNotifications}>
                    NOTIFICATIONS
                </button>

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

                <button type="button" onClick={() => reset()}>
                    RESET
                </button>
            </footer>
        </>
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
