
CREATE TABLE user(
    id INTEGER PRIMARY KEY,
    name VARCHAR(32) UNIQUE NOT NULL,
    password CHAR(60) NOT NULL,
    dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gamesWon INT DEFAULT 0,
    gamesDrawn INT DEFAULT 0,
    gamesLost INT DEFAULT 0
);
CREATE VIEW userRearranged as select password, dateCreated, name from user;
CREATE VIEW winLoss as select gamesWon, gamesDrawn, gamesLost, dateCreated, name from user;


CREATE TABLE game(
	id INTEGER PRIMARY KEY,
	uuid CHAR(16) UNIQUE NOT NULL,
	white INTEGER NOT NULL,
	black INTEGER NOT NULL,
	result CHAR(1) NOT NULL CHECK(result IN ('W', 'B', 'D')),
	resultDueTo CHAR(1) CHECK(resultDueTo IS NULL OR resultDueTo IN ('C', 'T', 'R')),
	gameStarted TIMESTAMP NOT NULL,
	gameEnded TIMESTAMP NOT NULL,
	pgn TEXT NOT NULL,

	FOREIGN KEY(white) REFERENCES user(id),
	FOREIGN KEY(black) REFERENCES user(id)
);

CREATE INDEX gameWhiteIndex
ON game(white);

CREATE INDEX gameBlackIndex
ON game(black);
