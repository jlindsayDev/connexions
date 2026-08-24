export const requestNotifications = async (e) => {
  const button = e.target;

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    new Notification("LEVEL UP", { body: "You did it!" });
    button.disabled = true;
    // button.style.display = "none";
  }
};

export const fetchFreshPuzzle = async (date) => {
  const response = await fetch(`/puzzles/${date}`);
  return await response.json();
};
