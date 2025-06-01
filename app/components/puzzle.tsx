import type { FC } from "hono/jsx";
import type { Card as CardType, Category as CategoryType } from "models";

type PuzzleProps = {
    guessedCategories: CategoryType[];
    availableCards: CardType[];
    trySelectCard: Function;
    tryGuess: Function;
};

const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => (
    <>
        <div class="category-container">
            {props.guessedCategories.map((c, i) => (
                <div class={`category-${c.difficulty}`} key={i}>
                    <h4>{atob(c.category)}</h4>
                    <h5>WORDS</h5>
                </div>
            ))}
        </div>

        <div class="card-container">
            {props.availableCards.map((c, _i) => (
                <button
                    className={"card"}
                    onClick={(_e: MouseEvent) => props.trySelectCard()}
                    key={c.position}
                >
                    {atob(c.content)}
                </button>
            ))}
        </div>

        <button type="button" onClick={(_e: MouseEvent) => props.tryGuess()}>
            Submit
        </button>
    </>
);

export default Puzzle;
