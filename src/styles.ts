import { css as czz } from "hono/css";
import { css } from "hono/jsx/dom/css";

// Server-side rendered CSS
export const bodyCss = czz`
    body {
        margin: 0;
        padding: 0;

        @media (prefers-color-scheme: light) {
            color: black;
            background-color: #CCC;
        }

        @media (prefers-color-scheme: dark) {
            color: #EEE;
            background-color: #222;
        }
    }
`;

export const flexContainer = css`
    display: flex;
    height: 100vh;
`;

export const flexContainerItem = css`
    display: flex;
    flex-direction: column;
    margin: auto auto;
    align-items: center;
    align-content: center;
    max-height: 80vh;
    max-width: 40vw;
`;

export const calendarContainer = css`
    /* display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
    align-self: flex-start; */
`;

export const puzzleContainerClass = css`
    /* display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 500px; */
`;

export const buttonGridClass = css`
    display: flex;
`;

export const calendarHeaderClass = css`
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 1rem;

    span {
        font-size: 2rem;
    }

    button {
        width: 2rem;

        @media (prefers-color-scheme: dark) {
            color: rgb(196, 196, 196);
            background-color: rgb(77, 77, 77);
            border-radius: 5px;
        }
    }
`;

export const gridDayClass = css`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 2.5rem;
    height: 2.5rem;
    text-decoration: none;
`;

export const downloadedClass = css`
    background-color: blanchedalmond;
    &::after {
        content: "*"
    }
`;

export const calendarGridClass = css`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;

    & ${gridDayClass} {
        @media (prefers-color-scheme: dark) {
            color: rgb(196, 196, 196);
            background-color: rgb(77, 77, 77);
            border-radius: 5px;
        }
    }
`;

export const gridHeaderClass = css`
    @media (prefers-color-scheme: dark) {
        color: rgb(196, 196, 196);
        background-color: rgb(93, 37, 37) !important;
    }
`;

export const gridEmptyClass = css`
    background-color: transparent;
`;

export const categoryGridClass = css`
    display: grid;
    gap: 1vw;
    margin-bottom: 1vw;

    @media (prefers-color-scheme: light) {
        & .category-0 { background-color: rgb(84, 146, 255); }
        & .category-1 { background-color: rgb(105, 227, 82); }
        & .category-2 { background-color: rgb(251, 212, 0); }
        & .category-3 { background-color: rgb(223, 123, 234); }
    }

    @media (prefers-color-scheme: dark) {
        & .category-0 { background-color: rgb(27, 59, 112); }
        & .category-1 { background-color: rgb(30, 126, 10); }
        & .category-2 { background-color: rgb(123, 110, 34); }
        & .category-3 { background-color: rgb(106, 8, 117); }
    }
`;

export const cardGridClass = css`
    display: grid;
    gap: 1vw;
    grid-template-columns: repeat(4, minmax(0, 1fr));

    @media (prefers-color-scheme: dark) {
        & button {
            color: rgb(196, 196, 196);
            background-color: rgb(77, 77, 77);
            border-radius: 5px;
        }
    }
`;

export const cardClass = css`
    padding: 25% 0rem;
    font-weight: bold;
    font-size: 0.8rem;

    word-wrap: break-word;
    word-break: break-word;

    &.selected {
        color: rgb(0,0,0);
        background-color: blanchedalmond;
    }
`;
