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
  const printDate = padNums(year, month + 1, day);
  const puzzleResponse = await fetch(`/puzzles/${printDate}`);
  const data = await puzzleResponse.json();
  return data;
};
