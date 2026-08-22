import { fetchPuzzleFromSource, insertPuzzles } from "../../src/lib/api";
import { parseResponseJson } from "../../src/lib/utils";

export const onRequestOptions = async (_context) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
      "Access-Control-Max-Age": "86400",
    },
  });
};

export const onRequestGet = async (context) => {
  const { date } = context.params;
  const selectQuery = "SELECT * FROM puzzles WHERE print_date = ?";
  let puzzleResponse = await context.env.DB.prepare(selectQuery)
    .bind(date)
    .run();

  if (!puzzleResponse.results.length) {
    const sourceResponseJson = await fetchPuzzleFromSource(new Date(date));
    puzzleResponse = await insertPuzzles(context.env.DB, [
      parseResponseJson(sourceResponseJson),
    ]);
  }

  const response = Response.json(puzzleResponse.results);
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};

export const onRequestPost = async (context) => {
  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};
