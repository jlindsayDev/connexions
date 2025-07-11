import type { FC } from "hono/jsx/dom";
import {
    calendarContainer,
    calendarGridClass,
    calendarHeaderClass,
    gridDayClass,
    gridEmptyClass,
} from "../styles";
import { pad } from "../utils";

type CalendarProps = {
    date: Date;
    moveMonth: (offset: number) => (_e: Event) => void;
    selectDateFn: (date: string) => (_e: Event) => void;
};

const Calendar: FC<CalendarProps> = (props: CalendarProps) => {
    const year = props.date.getFullYear();
    const month = props.date.getMonth();
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const renderDays = () => {
        const days = "M Tu W Th F Sa Su".split(" ").map((day) => (
            <div key={`header-${day}`} classList={[]}>
                {day}
            </div>
        ));

        for (let i = 0; i < firstDayIndex; i++) {
            const dayElement = (
                <div
                    key={`empty-${i}`}
                    classList={[gridDayClass, gridEmptyClass]}
                />
            );
            days.push(dayElement);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayElement = (
                <button
                    key={dateStr}
                    onClick={props.selectDateFn(dateStr)}
                    class={gridDayClass}
                >
                    {day}
                </button>
            );
            days.push(dayElement);
        }

        return days;
    };

    return (
        <div class={calendarContainer}>
            <nav class={calendarHeaderClass}>
                <button type="button" onClick={props.moveMonth(-1)}>
                    &larr;
                </button>

                <span>
                    {props.date.toLocaleString("default", { month: "long" })}{" "}
                    {year}
                </span>

                <button type="button" onClick={props.moveMonth(+1)}>
                    &rarr;
                </button>
            </nav>

            <div class={calendarGridClass}>{renderDays()}</div>
        </div>
    );
};

export default Calendar;
