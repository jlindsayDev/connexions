import type { FC } from "hono/jsx/dom";
import type { CardModel, CategoryModel } from "../models";
import {
    cardClass,
    cardGridClass,
    categoryGridClass,
    submitBtnCls,
} from "../styles";
import { fromBase64 } from "../utils";

type PuzzleProps = {
    guessedCategories: CategoryModel[];
    availableCards: CardModel[];
    trySelectCard: (card: CardModel) => (e: MouseEvent) => void;
    tryGuess: (_e: UIEvent) => void;
};

const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => (
    <>
        <div class={categoryGridClass}>
            {props.guessedCategories.map((c, i) => (
                <div class={`category-${c.difficulty}`} key={i}>
                    <h4>{fromBase64(c.category)}</h4>
                    <h5>WORDS</h5>
                </div>
            ))}
        </div>

        <div class={cardGridClass}>
            {props.availableCards
                .toSorted(({ position: a }, { position: b }) => a - b)
                .map((c) => (
                    <button
                        class={cardClass}
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
