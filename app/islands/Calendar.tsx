import { useState } from "hono/jsx";
import "./calendar.css";

export function Calendar({ startDate = new Date() }) {
    const [currentDate, setCurrentDate] = useState(startDate);

    const handlePrevMonth = () => {
        const calendarDate = new Date(
            currentDate.setMonth(currentDate.getMonth() - 1),
        );
        setCurrentDate(calendarDate);
    };

    const handleNextMonth = () => {
        const calendarDate = new Date(
            currentDate.setMonth(currentDate.getMonth() + 1),
        );
        setCurrentDate(calendarDate);
    };

    const createDayTile = (day: number) => {
        const date = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
        return (
            <a
                href={`/puzzle/${currentDate.getFullYear()}/${currentDate.getMonth()}/${day}`}
                key={date}
                class="day"
            >
                {day}
            </a>
        );
    };

    const renderDays = () => {
        const daysInMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0,
        ).getDate();

        const firstDayIndex = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
        ).getDay();

        const days = [];

        for (let i = 0; i < firstDayIndex; i++) {
            days.push(<div key={`empty-${i}`} class="day empty"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(createDayTile(i));
        }

        return days;
    };

    return (
        <div class="calendar-container">
            <div class="calendar-header">
                <button type="button" onClick={handlePrevMonth}>
                    &lt;
                </button>
                <div>
                    {currentDate.toLocaleString("default", { month: "long" })}{" "}
                    {currentDate.getFullYear()}
                </div>
                <button type="button" onClick={handleNextMonth}>
                    &gt;
                </button>
            </div>
            <div class="calendar-grid">{renderDays()}</div>
        </div>
    );
}
