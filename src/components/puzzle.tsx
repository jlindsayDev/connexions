import { type FC, useState } from "hono/jsx";
import { css } from "hono/jsx/dom/css";

const styles = css`
.category-container {
    gap: 8px;
    display: grid;
    margin-bottom: 8px;
}

.card-container {
    width: 100%;
    display: grid;
    gap: 1vw;
    justify-content: space-evenly;
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.card {
    border: 1px dashed black;
    padding: 3rem 0rem;
    font-weight: bold;
    font-size: 0.8rem;

    border-radius: 5px;
    word-wrap: break-word;
    word-break: break-word;

    transition: 250ms ease all;
}

.selected {
    background-color: blanchedalmond;
}
`;

export type PuzzleType = {
    id: number;
    print_date: string;
    nyt_id: number | null;
    difficulty: number | null;
};

export type CategoryType = {
    id: number;
    puzzle_id: number;
    difficulty: number;
    category: string;
    hint_card_id: number | null;
};

export type CardType = {
    id: number;
    puzzle_id: number;
    category_id: number;
    position: number;
    content: string;
};

type PuzzleProps = {
    date: string;
    guesses: Set<number>[];
    cards: CardType[];
    categories: CategoryType[];
};

const selectedCards: Set<number> = new Set();
const guessedCategories: CategoryType[] = [];
let availableCards: CardType[];
let triedGuesses: Set<number>[];

export const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => {
    const [cards, setCards] = useState(props.cards);
    const [categories, setCategories] = useState(props.categories);
    const [_guesses, _setGuesses] = useState(props.guesses);

    const tryGuess = (guess: Set<number>): boolean => {
        if (guess.size != 4) {
            return false;
        }

        if (!new Set(triedGuesses).add(guess)) {
            return false;
        }
        triedGuesses.push(guess);

        const guessedCards = availableCards.filter((c) =>
            guess.has(c.position),
        );

        const categoryId = guessedCards[0]?.category_id ?? -1;
        if (!guessedCards.every((c) => c.category_id == categoryId)) {
            return false;
        }

        availableCards = availableCards.filter((c) => !guess.has(c.position));

        setCards((cards: CardType[]) =>
            cards.filter((c) => !guess.has(c.position)),
        );

        selectedCards.clear();

        const guessedCategory = categories.find((c) => c.id === categoryId);
        if (!guessedCategory) {
            return false;
        }
        guessedCategories.push(guessedCategory);

        setCategories((categories: CategoryType[]) =>
            categories.filter((c) => c.id != categoryId),
        );

        return true;
    };

    const toggleCard = (position: number): boolean => {
        if (selectedCards.has(position)) {
            return selectedCards.delete(position);
        }

        if (selectedCards.size >= 4) {
            return false;
        }

        return !!selectedCards.add(position);
    };

    availableCards = Array.from(cards);

    const fetchedGuesses: string[] = [];
    triedGuesses = fetchedGuesses.map(
        (s) => new Set(s.split(",").map(Number.parseInt)),
    );
    triedGuesses.forEach(tryGuess);

    const fromBase64 = (base64: string) => {
        const binString = atob(base64);
        const bytes = Uint8Array.from<string>(
            binString,
            (m) => m.codePointAt(0) ?? -99,
        );
        return new TextDecoder().decode(bytes);
    };

    return (
        <>
            <div class="category-container">
                {guessedCategories.map((c, i) => (
                    <div class={`category-${c.difficulty}`} key={i}>
                        <h4>{fromBase64(c.category)}</h4>
                        <h5>WORDS</h5>
                    </div>
                ))}
            </div>

            <div class="card-container">
                {availableCards.map((c, _i) => (
                    <button
                        className={"card"}
                        onClick={(e: MouseEvent) => {
                            const target = e.target as HTMLButtonElement;
                            target?.classList.toggle("selected");
                            toggleCard(c.position);
                        }}
                        key={c.position}
                    >
                        {atob(c.content)}
                    </button>
                ))}
            </div>

            <button type="button" onClick={(_e) => tryGuess(selectedCards)}>
                Submit
            </button>
        </>
    );
};

export default Puzzle;
