import { useState } from "hono/jsx/dom";
import {
    calendarContainer,
    calendarGridClass,
    calendarHeaderClass,
    gridDayClass,
    gridEmptyClass,
} from "./styles";

type CalendarProps = {
    month: number;
    year: number;
    selectDateFn: (date: string) => (_e: MouseEvent) => void;
};

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

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();

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

        for (let i = 1; i <= daysInMonth; i++) {
            const monthStr = (month + 1).toString().padStart(2, "0");
            const dayStr = i.toString().padStart(2, "0");
            const date = `${year}-${monthStr}-${dayStr}`;

            const dayElement = (
                <button
                    key={date}
                    onClick={selectDateFn(date)}
                    class={gridDayClass}
                >
                    {i}
                </button>
            );
            days.push(dayElement);
        }

        return days;
    };

    return (
        <div class={calendarContainer}>
            <nav class={calendarHeaderClass}>
                <button type="button" onClick={handlePrevMonth}>
                    &larr;
                </button>

                <span>
                    {currentDate.toLocaleString("default", { month: "long" })}{" "}
                    {currentDate.getFullYear()}
                </span>

                <button type="button" onClick={handleNextMonth}>
                    &rarr;
                </button>
            </nav>

            <div class={calendarGridClass}>{renderDays()}</div>
        </div>
    );
};

export default Calendar;
