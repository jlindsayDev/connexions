export const onRequestOptions = async (_context) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST",
      "Access-Control-Max-Age": "86400",
    },
  });
};

export const onRequestPost = async (context) => {
  const query = "SELECT print_date FROM puzzles ORDER BY printDate LIMIT 1";

  // get date to begin fetching new puzzles
  let date;
  if ("date" in context.params) {
    date = context.params.date;
  } else {
    const dateResponse = await context.env.DB.prepare(query).first();
    if (!dateResponse) {
      date = null;
    }
  }

  // fetch new puzzles from source
  const ENCODED_URL =
      "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const url = `${fromBase64(ENCODED_URL)}${date}.json`;
  const responseJson = await (await fetch(url)).json();
  // return parseResponseJson(responseJson);

  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};

const parseResponseJson = async (json) => {
  const puzzle = {
    print_date: json.print_date,
    status: 0 /* NotAttempted */
  };

  const cards = [];
  const categories = json.categories.map(({ title, cards: categoryCards }, i) => {
    const cardsToAdd = categoryCards.map(({ position, content }) => ({
      puzzle_id: puzzle.id,
      category_id: -i, // for mapping category->card
      position,
      content
    }));

    cards.push(...cardsToAdd);

    return {
      id: -i,
      puzzle_id: puzzle.id,
      difficulty: i, // for mapping category->card
      title
    };
  });
  return { puzzle, categories, cards };
};
