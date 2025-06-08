import { useState } from "hono/jsx/dom";
import { css } from "hono/jsx/dom/css";

type CalendarProps = {
    month: number;
    year: number;
    selectDateFn: (date: string) => (_e: MouseEvent) => void;
};

const container = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto;
`;

const nav = css`
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 300px;
    margin-bottom: 10px;
`;

const grid = css`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
`;

const gridDay = css`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 2.5rem;
    height: 2.5rem;
    text-decoration: none;

    @media (prefers-color-scheme: light) {
        color: black;
        border: 1px solid #ccc;
    }

    @media (prefers-color-scheme: dark) {
        color: #ccc;
        border: 1px solid #555;
    }
`;

const gridEmpty = css`
    background-color: transparent;
    border: none;
`;

const Calendar = ({ month, year, selectDateFn }: CalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date(year, month));

    const handlePrevMonth = (_e: MouseEvent) => {
        const calendarDate = new Date(
            currentDate.setMonth(currentDate.getMonth() - 1),
        );
        setCurrentDate(calendarDate);
    };

    const handleNextMonth = (_e: MouseEvent) => {
        const calendarDate = new Date(
            currentDate.setMonth(currentDate.getMonth() + 1),
        );
        setCurrentDate(calendarDate);
    };

    const header = (
        <nav class={nav}>
            <button type="button" onClick={handlePrevMonth}>
                &larr;
            </button>

            <div>
                {currentDate.toLocaleString("default", { month: "long" })}{" "}
                {currentDate.getFullYear()}
            </div>

            <button type="button" onClick={handleNextMonth}>
                &rarr;
            </button>
        </nav>
    );

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();

        const days = "M Tu W Th F Sa Su".split(" ").map((day) => (
            <div key={`header-${day}`} classList={[gridDay, gridEmpty]}>
                {day}
            </div>
        ));

        for (let i = 0; i < firstDayIndex; i++) {
            const dayElement = (
                <div key={`empty-${i}`} classList={[gridDay, gridEmpty]} />
            );
            days.push(dayElement);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const monthStr = (month + 1).toString().padStart(2, "0");
            const dayStr = i.toString().padStart(2, "0");
            const date = `${year}-${monthStr}-${dayStr}`;

            const dayElement = (
                <button key={date} onClick={selectDateFn(date)} class={gridDay}>
                    {i}
                </button>
            );
            days.push(dayElement);
        }

        return days;
    };

    return (
        <div class={container}>
            {header}

            <div class={grid}>{renderDays()}</div>
        </div>
    );
};

export default Calendar;
