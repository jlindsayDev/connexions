import { handle } from "hono/service-worker";

// NOTE: THE PROBLEM I RAN INTO HERE IS THE APP MUST BE SERVERD OVER HTTPS

// const app = createApp().basePath("/sw");

function register() {
    navigator.serviceWorker
        .register("/sw.ts", { scope: "/sw", type: "module" })
        .then(
            (_registration) => {
                console.log("Register Service Worker: Success");
            },
            (_error) => {
                console.log("Register Service Worker: Error");
            },
        );
}
function start() {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            console.log("Unregister Service Worker");
            registration.unregister();
        }
        register();
    });
}
start();

// To support types
// https://github.com/microsoft/TypeScript/issues/14877
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("fetch", handle(app), null);
