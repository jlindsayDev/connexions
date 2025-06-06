import type { FC } from "hono/jsx";
import { css } from "hono/jsx/dom/css";
import type { Card as CardType, Category as CategoryType } from "models";
import { fromBase64 } from "./utils";

const categoryContainerCls = css`
    gap: 8px;
    display: grid;
    margin-bottom: 8px;

    > .category-0 { background-color: rgb(84, 146, 255); }
    > .category-1 { background-color: rgb(105, 227, 82); }
    > .category-2 { background-color: rgb(251, 212, 0); }
    > .category-3 { background-color: rgb(223, 123, 234); }
`;

const cardContainerCls = css`
    width: 100%;
    display: grid;
    gap: 1vw;
    justify-content: space-evenly;
    grid-template-columns: repeat(4, minmax(0, 1fr));
`;

const cardCls = css`
    border: 1px dashed black;
    padding: 3rem 0rem;
    font-weight: bold;
    font-size: 0.8rem;

    border-radius: 5px;
    word-wrap: break-word;
    word-break: break-word;

    transition: 250ms ease all;

    .selected {
        background-color: blanchedalmond;
    }
`;

type PuzzleProps = {
    guessedCategories: CategoryType[];
    availableCards: CardType[];
    trySelectCard: () => void;
    tryGuess: () => void;
};

export const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => (
    <>
        <div class={categoryContainerCls}>
            {props.guessedCategories.map((c, i) => (
                <div class={`category-${c.difficulty}`} key={i}>
                    <h4>{fromBase64(c.category)}</h4>
                    <h5>WORDS</h5>
                </div>
            ))}
        </div>

        <div class={cardContainerCls}>
            {props.availableCards.map((c, _i) => (
                <button
                    class={cardCls}
                    onClick={(_e: MouseEvent) => props.trySelectCard()}
                    key={c.position}
                >
                    {fromBase64(c.content)}
                </button>
            ))}
        </div>

        <button type="button" onClick={(_e: MouseEvent) => props.tryGuess()}>
            Submit
        </button>
    </>
);

export default Puzzle;
