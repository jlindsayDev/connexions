import { Dexie, type EntityTable } from "dexie";

// import Dexie from "https://app.unpkg.com/dexie@4.0.11";

interface Guess {
    id: number;
    print_date: string;
    num: number;
    guess: string;
}

enum PuzzleStatus {
    NotAttempted = 0,
    Attempted = 1,
    Solved = 2,
    New = 3,
}

interface Puzzle {
    id: number;
    print_date: string;
    status: PuzzleStatus;
}

const INDEXED_DB = new Dexie("PuzzlesDatabase") as Dexie & {
    guesses: EntityTable<Guess, "id">;
    puzzles: EntityTable<Puzzle, "id">;
};

// Schema declaration:
INDEXED_DB.version(2).stores({
    guesses: "++id, *print_date, num",
});

export { INDEXED_DB };

    export type { Guess, Puzzle, PuzzleStatus };

export const addGuess = async (
    print_date: string,
    num: number,
    guess: Set<number>,
) => {
    const guessStr = guess.values().toArray().join(",");
    return await INDEXED_DB.guesses.add({ print_date, num, guess: guessStr });
};

export const getGuesses = async (print_date: string): Promise<string[]> => {
    const guessPromise: Guess[] = await INDEXED_DB.guesses
        .where({ print_date })
        .toArray();
    const guesses = guessPromise.map(
        // (g) => new Set(g.guess.split(",").map(parseInt)), // Promise<Set<number>[]>
        (g) => g.guess,
    );
    return guesses;
};

const prepareDexie = () => {
    var db = new Dexie("FriendDatabase");

    // DB with single table "friends" with primary key "id" and
    // indexes on properties "name" and "age"
    db.version(1).stores({
        friends: `
        id,
        name,
        age`,
    });

    // Now add some values.
    db.friends
        .bulkPut([
            { id: 1, name: "Josephine", age: 21 },
            { id: 2, name: "Per", age: 75 },
            { id: 3, name: "Simon", age: 5 },
            { id: 4, name: "Sara", age: 50, notIndexedProperty: "foo" },
        ])
        .then(() => {
            return db.friends.where("age").between(0, 25).toArray();
        })
        .then((friends) => {
            console.error(
                "Found young friends: " + friends.map((friend) => friend.name),
            );

            return db.friends.orderBy("age").reverse().toArray();
        })
        .then((friends) => {
            console.error(
                "Friends in reverse age order: " +
                    friends.map((friend) => `${friend.name} ${friend.age}`),
            );

            return db.friends.where("name").startsWith("S").keys();
        })
        .then((friendNames) => {
            console.error("Friends on 'S': " + friendNames);
        })
        .catch((err) => {
            console.error("Ouch... " + err);
        });
};
