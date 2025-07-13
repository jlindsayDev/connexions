import type { FC } from "hono/jsx/dom";
import type { CardModel, CategoryModel } from "../models";
import {
    buttonGridClass,
    cardClass,
    cardGridClass,
    categoryGridClass,
    puzzleContainerClass,
} from "../styles";

type PuzzleProps = {
    guessedCategories: CategoryModel[];
    availableCards: CardModel[];
    selectCardFn: (card: CardModel) => (e: MouseEvent) => void;
    guessFn: (_e: UIEvent) => void;
};

const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => (
    <div class={puzzleContainerClass}>
        <div class={categoryGridClass}>
            {props.guessedCategories.map(({ difficulty, title }, i) => (
                <div class={`category-${difficulty}`} key={i}>
                    <h4>{title}</h4>
                    <h5>TODO: PUT WORDS HERE</h5>
                </div>
            ))}
        </div>

        <div class={cardGridClass}>
            {props.availableCards
                .toSorted(({ position: a }, { position: b }) => a - b)
                .map((card) => (
                    <button
                        class={cardClass}
                        onClick={props.selectCardFn(card)}
                        onKeyDown={props.guessFn}
                        key={card.id}
                    >
                        {card.content}
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
