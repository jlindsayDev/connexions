export const requestNotifications = async (e: MouseEvent) => {
    const button = e.target as HTMLButtonElement;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        new Notification("LEVEL UP", { body: "You did it!" });
        button.disabled = true;
        // button.style.display = "none";
    }
};

() => {
    let i = 0;
    // Using an interval cause some browsers (including Firefox)
    // are blocking notifications if there are too much in a certain time.
    const interval = setInterval(() => {
        // Thanks to the tag, we should only see the
        // "Hi no 9 from MDN." notification
        const n = new Notification(`Hi no ${i} from MDN.`, {
            tag: "soManyNotification",
        });
        if (i === 9) {
            clearInterval(interval);
        }
        i++;
    }, 200);
};
