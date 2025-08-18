import type { FC } from "hono/jsx/dom";
import type { CardModel, CategoryModel } from "../models";

type PuzzleProps = {
    printDate: string;
    guessedCategories: CategoryModel[];
    availableCards: CardModel[];
    guessFn: (data: FormData) => void;
    reset: () => void;
};

// https://stackoverflow.com/a/44731398
// &#10006;
// &#x2715;
// &#x274c;

const Puzzle: FC<PuzzleProps> = (props: PuzzleProps) => {
    const selected: Set<number> = new Set();

    const tryToggle = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const value = Number.parseInt(target.value, 10);

        if (selected.delete(value)) {
            target.checked = false;
        } else {
            target.checked = selected.size < 4 && !!selected.add(value);
        }
    };

    const header = (
        <nav>
            <span>{props.printDate}</span>
            <button type="button" onClick={props.reset}>
                &#x2715;
            </button>
        </nav>
    );

    const categories = props.guessedCategories.map(
        ({ difficulty, title }, i) => (
            <div class={`category-${difficulty}`} key={i}>
                <h4>{title}</h4>
                <h5>TODO: PUT WORDS HERE</h5>
            </div>
        ),
    );

    const cards = props.availableCards
        .toSorted(({ position: a }, { position: b }) => a - b)
        .map((card) => (
            <label key={card.id}>
                <input
                    type="checkbox"
                    name="cards"
                    value={card.position}
                    onChange={tryToggle}
                />
                <>{card.content}</>
            </label>
        ));

    const section = (
        <section id="puzzle">
            <>{categories}</>
            <>{cards}</>
        </section>
    );

    const footer = (
        <section>
            {props.availableCards.length > 0 && (
                <input type="submit" value="GUESS" />
            )}
        </section>
    );

    return (
        <main>
            <form action={props.guessFn}>
                {header}
                {section}
                {footer}
            </form>
        </main>
    );
};

export default Puzzle;
