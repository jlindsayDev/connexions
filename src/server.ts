import { fromBase64 } from "utils";
import singlePageApp from "../src/index.html";
import * as models from "./models";

const fetchPuzzleFromSource = async (date: string) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const url = `${fromBase64(ENCODED_URL)}${date}.json`;
  const json = (await (await fetch(url)).json()) as models.PuzzleResponseModel;

  const puzzle: models.PuzzleModel = {
    id: json.id,
    print_date: json.print_date,
    status: models.PuzzleStatusEnum.NotAttempted,
  };

  const cards: models.CardModel[] = [];
  const categories = json.categories.map(
    ({ title, cards: categoryCards }, i) => {
      const cardsToAdd = categoryCards.map(({ position, content }) => ({
        id: -i,
        puzzle_id: puzzle.id,
        category_id: -i,
        position,
        content: content,
      }));

      cards.push(...cardsToAdd);

      return {
        id: -i,
        puzzle_id: puzzle.id,
        difficulty: i,
        title: title,
      };
    },
  );

  return { puzzle, categories, cards } as models.GameState;
};

const server = Bun.serve({
  routes: {
    "/": singlePageApp,
    "/day/:date": async (req) => {
      const gameState = await fetchPuzzleFromSource(req.params.date);
      return Response.json(gameState);
    },
  },
  development: true,
});

console.log(`Server running at ${server.url}`);
