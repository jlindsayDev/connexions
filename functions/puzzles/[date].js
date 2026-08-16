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

  const response = Response.json(puzzleResponse);
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
