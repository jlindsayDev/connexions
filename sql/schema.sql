CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY,
    print_date TEXT UNIQUE NOT NULL,
    nyt_id INTEGER UNIQUE,
    difficulty INTEGER
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS puzzles_by_print_date ON puzzles (print_date);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    puzzle_id INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    content TEXT NOT NULL,
    hint_card_id INTEGER UNIQUE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (hint_card_id) REFERENCES cards(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) STRICT;
