import { useState } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";

type CardProps = {
    content: string;
    isSelected: boolean;
    position: number;
    toggleCard: Function;
};

const Card = (props: CardProps): JSX.Element => {
    const [isSelected, setIsSelected] = useState(props.isSelected);

    const toggleSelect = (e: MouseEvent) => {
        e.preventDefault();

        props.toggleCard(props.position);
        setIsSelected(!isSelected);
    };

    return (
        <button
            className={`card ${isSelected ? "selected" : ""}`}
            onClick={toggleSelect}
        >
            {props.content}
        </button>
    );
};

export default Card;
