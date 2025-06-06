import type { FC } from "hono/jsx";
import { css } from "hono/jsx/dom/css";
import type { Card as CardType, Category as CategoryType } from "models";

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
