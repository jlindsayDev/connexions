const startServiceWorkerRegistration = async () => {
    if (!import.meta.env["PROD"]) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            console.log(`Unregistering Service Worker: ${registration}`);
            registration.unregister();
        }
    }

    console.log("Registering new service worker");
    await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        type: "module",
    });
};

if ("serviceWorker" in navigator) {
    window.addEventListener("load", startServiceWorkerRegistration);
}
