import { css } from "hono/jsx/dom/css";

export const calendarContainer = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
`;

export const calendarHeaderClass = css`
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 300px;
    margin-bottom: 1rem;

    span {
        font-size: 2rem;
    }

    /* @media (prefers-color-scheme: light) {} */
    & button {
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

export const calendarGridClass = css`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;

    & ${gridDayClass} {
        /* @media (prefers-color-scheme: light) {} */
        @media (prefers-color-scheme: dark) {
            color: rgb(196, 196, 196);
            background-color: rgb(77, 77, 77);
            border-radius: 5px;
        }
    }
`;

export const gridHeaderClass = css`
    /* @media (prefers-color-scheme: light) {} */
    @media (prefers-color-scheme: dark) {
        color: rgb(196, 196, 196);
        background-color: rgb(93, 37, 37) !important;
    }
`;

export const gridEmptyClass = css`
    background-color: transparent;
`;

export const categoryGridClass = css`
    gap: 8px;
    display: grid;
    margin-bottom: 8px;

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
    width: 100%;
    max-width: 600px;
    display: grid;
    gap: 1vw;
    justify-content: space-evenly;
    grid-template-columns: repeat(4, minmax(0, 1fr));

    /* @media (prefers-color-scheme: light) {} */
    @media (prefers-color-scheme: dark) {
        & button {
            color: rgb(196, 196, 196);
            background-color: rgb(77, 77, 77);
            border-radius: 5px;
        }
    }
`;

export const cardClass = css`
    padding: 3rem 0rem;
    font-weight: bold;
    font-size: 0.8rem;

    word-wrap: break-word;
    word-break: break-word;

    transition: 250ms ease all;

    &.selected {
        color: rgb(0,0,0);
        background-color: blanchedalmond;
    }
`;

export const submitBtnCls = css``;
