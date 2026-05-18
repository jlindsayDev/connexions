import { fromBase64 } from "utils";
import * as models from "./models";

type CardResponseModel = {
  content: string;
  position: number;
};
type CategoryResponseModel = {
  title: string;
  cards: CardResponseModel[];
};
type PuzzleResponseModel = {
  id: number;
  status: string;
  print_date: string;
  categories: CategoryResponseModel[];
};

const parseResponseJson = (json: PuzzleResponseModel): models.GameState => {
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
        content,
      }));

      cards.push(...cardsToAdd);

      return {
        id: -i,
        puzzle_id: puzzle.id,
        difficulty: i,
        title,
      };
    },
  );

  return { puzzle, categories, cards };
};

export const fetchDate = async (date: string) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const url = `${fromBase64(ENCODED_URL)}${date}.json`;
  const responseJson = await (await fetch(url)).json();
  return parseResponseJson(responseJson);
};

// establish Cloudflare D1 DB connection

// request puzzles from today
