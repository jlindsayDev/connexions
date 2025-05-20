import type { JSX } from "hono/jsx/jsx-runtime";
import type {
    Card as CardType,
    Category as CategoryType,
    Puzzle as PuzzleType,
} from "models";

type PuzzleProps = {
    puzzle: PuzzleType;
    cards: CardType[];
    categories: CategoryType[];
};

const Puzzle = (props: PuzzleProps): JSX.Element => (
    <div class="puzzle-container">
        <div class="category-container">
            {props.categories
                .filter((c) => c.difficulty % 2 == 0)
                .map((c, i) => (
                    <div class={`category-${c.difficulty}`} key={i}>
                        <h4>{c.category}</h4>
                        <h5>WORDS</h5>
                    </div>
                ))}
        </div>

        <div class="card-container">
            {props.cards
                .filter((c) => c.position % 2 == 0)
                .map((c, i) => (
                    <div class="card" key={i}>
                        <span>{c.content}</span>
                    </div>
                ))}
        </div>
    </div>
);

export default Puzzle;
