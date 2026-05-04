# Connexions

## TODO

- [ ] Fetch from source (might require SW because of CORS)
- [ ] Export/Import IndexedDB
- [ ] Service Worker for full Progressive Web App installation
- [ ] Play statistics?

## What have I learned?

- DevContainer setup (OrbStack + DevPods)
- How to set up a single page application
  - Bun (Nodejs)
  - Biome (linter/formatter)
  - Typescript
  - Rollup/Rolldown: bundling
- Benefits and tradeoffs of front-end frameworks
  - Struggles with trying to make HonoX do what I want
- The importance of stateless components
- WebComponents (Lit)
- DevContainers

## What **all** have I tried?

Basically, I was looking to throw tech at a wall and see what worked, all for the sake of "learning".

### Using an LLM

I was just prompting ChatGPT for complex features and hoping for the best. This was before I learned about "Plan" mode, so you can imagine the disaster of disjoint code snippets.

I was prompting for several features:
 - progressive web app

### HTTP Range Requests

Using HTTP Range requests to query a statically-hosted SQLite DB. This allows for quering large datasets without downloading the entire database locally.

- failed because I was insistent on getting sql.js-httpvfs to run without JS bundling. Monumental timesink!
  - what I learned: While I am nostalgic for the old jQuery days of plug-n-play JS, I should learn to adapt the "new" era of JS tooling.
- Tried to somehow led to trying DuckDB instead. https://github.com/duckdb/duckdb-wasm
  - https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/
  - https://news.ycombinator.com/item?id=29040120
- https://github.com/duckdb/duckdb-wasm

## My Mental Thought Process

- I want bleeding edge libraries of things I don't understand or know if they'll even be useful.
- Why was I insisting on making HonoX do things it wasn't built to do?
