import { useState } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import type {
    Card as CardType,
    Category as CategoryType,
    Puzzle as PuzzleType,
} from "models";
import Card from "./Card";

type PuzzleProps = {
    puzzle: PuzzleType;
    cards: CardType[];
    categories: CategoryType[];
};

let selectedCards: Set<number> = new Set();
let guessedCategories: CategoryType[] = [];

const toggleCard = (position: number) => {
    if (!selectedCards.delete(position)) {
        selectedCards.add(position);
    }
};

const guessCategory = () => {
    if (selectedCards.size != 4) {
        console.log(selectedCards);
        return;
    }
};

const Puzzle = (props: PuzzleProps): JSX.Element => {
    const [cards, _setCards] = useState(props.cards);
    const [_categories, _setCategories] = useState(props.categories);

    return (
        <>
            <div class="category-container">
                {guessedCategories.map((c, i) => (
                    <div class={`category-${c.difficulty}`} key={i}>
                        <h4>{c.category}</h4>
                        <h5>WORDS</h5>
                    </div>
                ))}
            </div>

            <div class="card-container">
                {cards.map((c, _i) => (
                    <Card {...c} isSelected={false} toggleCard={toggleCard} />
                ))}
            </div>

            <button type="button" onClick={guessCategory}>
                Submit
            </button>
        </>
    );
};

export default Puzzle;
