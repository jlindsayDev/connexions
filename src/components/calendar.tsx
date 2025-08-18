import type { FC } from "hono/jsx/dom";
import { PuzzleStatus } from "../models";
import { pad } from "../utils";

type CalendarProps = {
    date: Date;
    downloaded: Map<number, PuzzleStatus>;
    moveMonth: (offset: number) => (_e: Event) => void;
    selectDateFn: (date: string) => (_e: Event) => void;
};

const Calendar: FC<CalendarProps> = (props: CalendarProps) => {
    const year = props.date.getFullYear();
    const month = props.date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const header = (
        <nav>
            <button type="button" onClick={props.moveMonth(-1)}>
                &larr;
            </button>

            <span>
                {props.date.toLocaleString("default", {
                    month: "long",
                })}{" "}
                {year}
            </span>

            <button type="button" onClick={props.moveMonth(+1)}>
                &rarr;
            </button>
        </nav>
    );

    const renderDays = () => {
        const days = "Su M Tu W Th F Sa"
            .split(" ")
            .map((day) => <div key={`header-${day}`}>{day}</div>);

        for (let i = 0; i < firstDayIndex; i++) {
            const dayElement = <div key={`empty-${i}`} />;
            days.push(dayElement);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayElement = (
                <button key={dateStr} onClick={props.selectDateFn(dateStr)}>
                    {day}
                </button>
            );
            days.push(dayElement);
        }

        return days;
    };

    const section = <section id="calendar">{renderDays()}</section>;

    return (
        <main>
            {header}
            {section}
        </main>
    );
};

export default Calendar;
