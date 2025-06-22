import { Hono } from "hono";
import { handle } from "hono/service-worker";

declare const self: ServiceWorkerGlobalScope;

const app = new Hono().basePath("/sw");
app.get("/", (c) => c.text("Hello World"));
app.get("/ping", (c) => c.text("pong"));

self.addEventListener("fetch", (e: FetchEvent) => handle(app)(e));
