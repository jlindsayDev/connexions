export async function onRequestGet(context) {
  const { request, functionPath, params } = context;

  console.log(functionPath);
  console.log(params);

  const response = await context.env.DB.prepare(
    "SELECT * FROM puzzles LIMIT 5",
  ).run();

	return Response.json(response);
}

export async function onRequestPost(context) {
}
