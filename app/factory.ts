import Database from "bun:sqlite";
import { createFactory } from "hono/factory";

interface Env {
    Bindings: {
        DB: Database;
    };
}

export const DB = new Database("connections.db", {
    readonly: true,
    strict: true,
});

const factory = createFactory<Env>();
export const createRoute = factory.createHandlers;
