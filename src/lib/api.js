import { fromBase64, getNextDate } from "./utils.js";

export const fetchPuzzleFromSource = async (date) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const dateStr = date.toISOString().slice(0, 10);
  const url = `${fromBase64(ENCODED_URL)}${dateStr}.json`;
  console.info(`HTTP GET ${url}`);
  return await (await fetch(url)).json();
};

async function* puzzleIterator(startDate) {
  for (let date = startDate; ; date = getNextDate(date)) {
    try {
      yield await fetchPuzzleFromSource(date);
    } catch (err) {
      const dateStr = date.toISOString().slice(0, 10);
      process.stderr.write(`Error occurred fetching date ${dateStr}`, err);
      return;
    }
  }
}

export function* batchedIterator(startDate, batchSize = 10) {
  const iter = puzzleIterator(startDate);
  while (true) {
    yield iter.take(batchSize);
  }
}

export const fetchPuzzlesFromSource = async (startDateStr, numDays) => {
  const startDate = new Date(startDateStr);

  const puzzles = [];
  for (let i = 0; i < numDays; ++i) {
    const date = getNextDate(startDate, i);
    const responseJson = await fetchPuzzleFromSource(date);
    puzzles.push(responseJson);
  }
  return puzzles;
};
