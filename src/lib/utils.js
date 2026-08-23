export const pad = (i) => i.toString().padStart(2, "0");

export const padNums = (...ns) =>
  ns.map((n) => n.toString().padStart(2, "0")).join("-");

export const padDate = (date) =>
  padNums(date.getFullYear(), date.getMonth(), date.getDate());

export const getNextDate = (date, skip = 0) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1 + skip);

export const range = (start, stop, step = 1) =>
  Array.from(
    { length: Math.ceil((stop - start) / step) },
    (_, i) => start + i * step,
  );

export const indexBy = (arr, key) =>
  arr.reduce((acc, el) => (acc[el[key]] = el), {});

export const partition = (arr, partitionFn) =>
  arr.reduce(
    (acc, v) => {
      acc[partitionFn(v) ? 0 : 1].push(v);
      return acc;
    },
    [[], []],
  );

// https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
export const fromBase64 = (base64) => {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
};

export const parseResponseJson = (json, encrypt = true) => {
  const categories = json.categories.map(({ title, cards }, i) => ({
    difficulty: i,
    title: encrypt ? toBase64(title) : title,
    cards: cards.map(({ position, content }) => ({
      position,
      content: encrypt ? toBase64(content) : content,
    })),
  }));

  return {
    source_id: json.id,
    print_date: json.print_date,
    categories,
  };
};

export const formatPuzzles = (puzzles, categories, cards) => {
  const indexedCategories = Map.groupBy(categories, (c) => c.puzzle_id);
  const indexedCards = Map.groupBy(cards, (c) => c.category_id);

  return puzzles.map((puzzle) => ({
    id: puzzle.id,
    printDate: puzzle.print_date,
    sourceId: puzzle.source_id,

    categories: indexedCategories.get(puzzle.id).map((category) => ({
      id: category.id,
      puzzleId: category.puzzle_id,
      hintCardId: category.hint_card_id,
      difficulty: category.difficulty,
      title: category.title,

      cards: indexedCards.get(category.id).map((card) => ({
        id: card.id,
        categoryId: card.category_id,
        position: card.position,
        content: card.content,
      })),
    })),
  }));
};
