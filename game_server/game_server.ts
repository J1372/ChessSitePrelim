import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { Color, Game, Move } from 'chessgameplay';
import express from 'express';
import * as GameServerService from './game_server_service.js'
import mongoose from "mongoose"

if (process.env.MONGO_CONNECT_URL == undefined) {
    throw new Error('Missing env MONGO_CONNECT_URL.');
}

await mongoose.connect(process.env.MONGO_CONNECT_URL);

async function shutdown(_: NodeJS.Signals) {
    console.log("Stopping server.");
    await mongoose.disconnect();
    console.log("Closed database.");
    process.exit();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 4000;

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

function handlePlayerMove(game: Game, user: string, moveJson: any) {

    const isValidSquare = (json: any) => json != null 
                                        && json.row != null && json.col != null
                                        && typeof(json.row) === 'number' && typeof(json.col) === 'number';

    if (!moveJson || !isValidSquare(moveJson.from) || !isValidSquare(moveJson.to) || typeof(moveJson.promotedTo) !== 'string') {
        return;
    }

    // may still have other properties.
    const move = moveJson as Move;

    const gameUUID = game.uuid;
    const result = GameServerService.tryMove(gameUUID, user, move);

    switch (result) {
        case GameServerService.MoveResult.ACCEPTED: {
            io.to(gameUUID).emit('move', JSON.stringify({ move: { from: move.from, to: move.to, promotedTo: move.promotedTo } }));
            break;
        }
        case GameServerService.MoveResult.CHECKMATE: {
            io.to(gameUUID).emit('move', JSON.stringify({ move: { from: move.from, to: move.to, promotedTo: move.promotedTo }, ended: 'mate' }));
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
            console.log(`Received ${user}'s move: ${move} for ${game.uuid}`);
            handlePlayerMove(game, user, JSON.parse(move));
        });

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
