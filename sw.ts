import { Hono } from "hono";
import { fire } from "hono/service-worker";

declare const self: ServiceWorkerGlobalScope;

const app = new Hono()
    .basePath("/")
    .get("/", (c) => c.text("We're in ISTANBUL"))
    .get("/ping", (c) => c.text("pong"))
    .get("/puzzle/:date", (c) => {
        console.log("DOES THIS APPEAR");
        const date = c.req.param("date");
        return c.text(date, 200);
    })
    .all((c) => c.text("HELLO WORLD"));

export type ServiceWorkerType = typeof app;

fire(app);
