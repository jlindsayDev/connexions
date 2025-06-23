import type { FC } from "hono/jsx/dom";
import type { CardModel, CategoryModel } from "../models";
import {
    buttonGridClass,
    cardClass,
    cardGridClass,
    categoryGridClass,
    puzzleContainerClass,
} from "../styles";
import { fromBase64 } from "../utils";

type PuzzleProps = {
    guessedCategories: CategoryModel[];
    availableCards: CardModel[];
    selectCardFn: (card: CardModel) => (e: MouseEvent) => void;
    guessFn: (_e: UIEvent) => void;
};

const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => (
    <div class={puzzleContainerClass}>
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
                        onClick={props.selectCardFn(c)}
                        onKeyDown={props.guessFn}
                        key={c.id}
                    >
                        {fromBase64(c.content)}
                    </button>
                ))}
        </div>

        <div class={buttonGridClass}>
            {props.availableCards.length > 0 && (
                <button type="button" onClick={props.guessFn}>
                    Guess
                </button>
            )}
        </div>
    </div>
);

export default Puzzle;
