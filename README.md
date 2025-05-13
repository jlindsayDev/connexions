# connexions

Typical `honox` project structure ([link](https://github.com/honojs/honox#project-structure))

```
.
├── app
│   ├── global.d.ts // global type definitions
│   ├── routes
│   │   ├── _404.tsx // not found page
│   │   ├── _error.tsx // error page
│   │   ├── _renderer.tsx // renderer definition
│   │   ├── merch
│   │   │   └── [...slug].tsx // matches `/merch/:category`, `/merch/:category/:item`, `/merch/:category/:item/:variant`
│   │   ├── about
│   │   │   └── [name].tsx // matches `/about/:name`
│   │   ├── blog
│   │   │   ├── index.tsx // matches /blog
│   │   │   └── (content)
│   │   │       ├── _renderer.tsx // renderer definition for routes inside this directory
│   │   │       └── [name].tsx    // matches `/blog/:name`
│   │   └── index.tsx // matches `/`
│   └── server.ts // server entry file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

client side ([link](https://github.com/honojs/honox#get-started---with-client))

```
.
├── app
│   ├── client.ts // client entry file
│   ├── global.d.ts
│   ├── islands
│   │   └── counter.tsx // island component
│   ├── routes
│   │   ├── _renderer.tsx
│   │   └── index.tsx
│   └── server.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Using Biome as linter/formatter

Using Preact as Renderer
