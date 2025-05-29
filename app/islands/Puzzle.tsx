import { type FC, type PropsWithChildren, useState } from "hono/jsx";
import type { Card as CardType, Category as CategoryType } from "models";

type PuzzleProps = {
    guesses: Set<number>[];
    cards: CardType[];
    categories: CategoryType[];
};

const selectedCards: Set<number> = new Set();
const guessedCategories: CategoryType[] = [];
let availableCards: CardType[];
let triedGuesses: Set<Set<number>>;

const Puzzle: FC<PuzzleProps> = ({
    children,
    ...props
}: PropsWithChildren<PuzzleProps>) => {
    const [cards, setCards] = useState(props.cards);
    const [categories, setCategories] = useState(props.categories);
    const [guesses, _setGuesses] = useState(props.guesses);

    const tryGuess = (guess: Set<number>): boolean => {
        if (guess.size != 4) {
            return false;
        }

        if (!triedGuesses.add(guess)) {
            return false;
        }

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
    triedGuesses = new Set();
    guesses.forEach(tryGuess);

    return (
        <>
            <div class="category-container">
                {guessedCategories.map((c, i) => (
                    <div class={`category-${c.difficulty}`} key={i}>
                        <h4>{atob(c.category)}</h4>
                        <h5>WORDS</h5>
                    </div>
                ))}
            </div>

            <div class="card-container">
                {availableCards.map((c, _i) => (
                    <button
                        className={`card`}
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
