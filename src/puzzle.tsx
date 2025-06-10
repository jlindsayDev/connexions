import type { FC } from "hono/jsx";
import { css } from "hono/jsx/dom/css";
import type { CardModel, CategoryModel } from "./models";
import { fromBase64 } from "./utils";

const categoryContainerCls = css`
    gap: 8px;
    display: grid;
    margin-bottom: 8px;

    & .category-0 { background-color: rgb(84, 146, 255); }
    & .category-1 { background-color: rgb(105, 227, 82); }
    & .category-2 { background-color: rgb(251, 212, 0); }
    & .category-3 { background-color: rgb(223, 123, 234); }
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

    &.selected {
        background-color: blanchedalmond;
    }
`;

const submitBtnCls = css``;

type PuzzleProps = {
    guessedCategories: CategoryModel[];
    availableCards: CardModel[];
    trySelectCard: (card: CardModel) => (e: MouseEvent) => void;
    tryGuess: (_e: UIEvent) => void;
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
            {props.availableCards
                .toSorted(({ position: a }, { position: b }) => a - b)
                .map((c) => (
                    <button
                        class={cardCls}
                        onClick={props.trySelectCard(c)}
                        onKeyDown={props.tryGuess}
                        key={c.id}
                    >
                        {fromBase64(c.content)}
                    </button>
                ))}
        </div>

        {!!props.availableCards.length && (
            <button type="button" onClick={props.tryGuess} class={submitBtnCls}>
                Submit
            </button>
        )}
    </>
);

export default Puzzle;
