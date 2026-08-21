import { fromBase64 } from "../../src/lib/utils";

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
  const query = "SELECT * FROM puzzles WHERE print_date = ?";
  const puzzleResponse = await context.env.DB.prepare(query).bind(date).run();

  const response = Response.json(
    puzzleResponse.results.length
      ? puzzleResponse.results
      : await fetchPuzzleFromSource(new Date(date)),
  );
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

const fetchPuzzleFromSource = async (date) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const dateStr = date.toISOString().slice(0, 10);
  const url = `${fromBase64(ENCODED_URL)}${dateStr}.json`;
  const response = await fetch(url);
  console.info(`HTTP GET [${response.status}] ${url}`);
  return await response.json();
};
