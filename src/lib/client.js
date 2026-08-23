import { padNums } from "../lib/utils.js";

export const requestNotifications = async (e) => {
  const button = e.target;

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    new Notification("LEVEL UP", { body: "You did it!" });
    button.disabled = true;
    // button.style.display = "none";
  }
};

export const fetchFreshPuzzle = async (year, month, day) => {
  const response = await fetch(`/puzzles/${padNums(year, month + 1, day)}`);
  return await response.json();
};
