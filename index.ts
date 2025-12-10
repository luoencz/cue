import index from "./index.html";

Bun.serve({
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
  },
});

console.log(`Listening on http://localhost:3000`);
