import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { Board, Color, Game } from 'chessgameplay';
import express from 'express';
import * as GameServerService from './game_server_service.js'

import mongoose from "mongoose"
await mongoose.connect('mongodb://127.0.0.1:27017/Chess');

process.on('SIGINT', async (code) => {
    console.log("Stopping server.");
    await mongoose.disconnect();
    console.log("Closed database.");
    process.exit();
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const port = 4000;

app.post('/start-active-game', express.json(), (req, res) => {
    const data = req.body;
    console.log(data);

    if (data.auth === 'aaa') {
        const game = data.game;

        let hostPlaysAsColor;
        if (game.hostPlaysAs === 'W') {
            hostPlaysAsColor = Color.White;
        } else if (game.hostPlaysAs === 'B') {
            hostPlaysAsColor = Color.Black;
        } else {
            hostPlaysAsColor = undefined;
        }

        GameServerService.createGame(game.uuid, game.creator, data.userJoining, hostPlaysAsColor, game.gameType);
        console.log(`Game created, game count: ${GameServerService.getActiveGameCount()}.`)

        res.sendStatus(200);
    } else {
        console.log('Attempted game creation with invalid auth token.')
        res.sendStatus(403);
    }
});

async function establishGameViewerConnection(client: Socket, gameUUID: string): Promise<Game | null> {
    const game = GameServerService.getActiveGame(gameUUID);

    if (game !== undefined) {
        // send gamestate to client
        client.emit('game-state', JSON.stringify(game));

        // add socket to game list
        client.join(gameUUID);
        return game;
    } else {
        return null;
    }
}


function handleGameClose(game: Game) {
    // maybe send a final reason for game ending before closing.
    io.in(game.uuid).disconnectSockets();
}

function handlePlayerMove(game: Game, user: string, move: any) {
    const gameUUID = game.uuid;

    console.log(gameUUID);

    if (!move || typeof(move.from) != 'string' || typeof(move.to) != 'string') {
        return;
    }
    // todo allow game to handle notation conversion, or send/receive ints.
    //  since board tied closely to game. allows games to have different boards.
    const fromSquare = Board.convertFromNotation(move.from);
    const toSquare = Board.convertFromNotation(move.to);

    // Move notation invalid for board size.
    if (!fromSquare || !toSquare) {
        return false;
    }

    const userSelectedPromotion = move.promotion;
    const result = GameServerService.tryMove(gameUUID, user, fromSquare, toSquare, userSelectedPromotion);
    
    switch (result) {
        case GameServerService.MoveResult.ACCEPTED: {
            io.to(gameUUID).emit('move', JSON.stringify({ from: move.from, to: move.to, promotion: userSelectedPromotion }));
            break;
        }
        case GameServerService.MoveResult.CHECKMATE: {
            io.to(gameUUID).emit('move', JSON.stringify({ from: move.from, to: move.to, promotion: userSelectedPromotion, ended: 'mate' }));
            handleGameClose(game);
            break;
        }
    };
}

function handlePlayerResign(game: Game, user: string) {
    if (GameServerService.tryResign(game.uuid, user)) { // should not be needed but check anyway
        io.to(game.uuid).emit('resign', user);
        handleGameClose(game);
    }
}

// can be async?
io.on('connection', async client => {
    console.log(`Socket ${client.id} connected.`);

    client.on('disconnect', () => {
        console.log(`Socket ${client.id} disconnected.`);
        // socketio - on disconnect, automatically clears socket from room.
    });

    const url = client.handshake.url;
    console.log(url);

    const uuid = client.handshake.query.gameUUID;
    
    if (uuid == undefined || Array.isArray(uuid)) {
        console.log('Invalid query uuid');
        client.disconnect();
        return;
    }

    console.log(`Connecting to: ${uuid}`);

    const game = await establishGameViewerConnection(client, uuid);

    if (game === null) {
        console.log('Game not found');
        client.disconnect();
        return;
    }

    const cookie = client.handshake.headers.cookie;
    const sidRow = cookie?.split('; ')
        .find(cookie => cookie.startsWith('connect.sid='));

    if (!sidRow) {
        console.log('User is not logged in');
        return;
    }

    const sidRaw = sidRow.split('=')[1];
    const sidDecoded = decodeURIComponent(sidRaw);
    const sidParsed = sidDecoded.substring(sidDecoded.indexOf(':') + 1, sidDecoded.indexOf('.'));
    console.log(`Session id: ${sidParsed}`);

    // can do a promise.all
    const user = await GameServerService.getLoggedInUser(sidParsed);

    // if user is player in game being joined, then establish player message handlers to respond move, resign,, otherwise, just do disconnect handler.
    if (game.isPlayer(user)) { // name based, if user changes name ....
        console.log(`User: ${user} - player.`);

        client.on('move', (move: string) => {
            console.log(`Received ${user}'s move: ${move}`);
            handlePlayerMove(game, user, JSON.parse(move));
        }); // maybe move is square interface, two ints.

        client.on('resign', () => {
            handlePlayerResign(game, user);
        });
    } else {
        console.log(`User: ${user} - viewer.`);
    }
});

io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
  });


console.log(`Game socket server listening on port ${port}`);
server.listen(port);
