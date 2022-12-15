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


create table whiteGames(
	userId INT NOT NULL,
	gameId UNIQUE INT NOT NULL,
	
	FOREIGN KEY(userId) REFERENCES user(id),
	FOREIGN KEY(gameId) REFERENCES game(id)
	
);

create table blackGames(
	userId INT NOT NULL,
	gameId UNIQUE INT NOT NULL,
	
	FOREIGN KEY(userId) REFERENCES user(id),
	FOREIGN KEY(gameId) REFERENCES game(id)
	
);
