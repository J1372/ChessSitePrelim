import express from 'express';
import { Board } from 'chessgameplay';
import { Color } from 'chessgameplay';
import { randomUUID } from 'crypto';
import { matchedData, validationResult } from 'express-validator';
import * as GameService from '../services/games_service.js'

// SSE game observers
const gameObservers = new Map<string, Array<Observer>>();

export function getOpenGames(_: express.Request, res: express.Response) {
    res.send(GameService.getOpenGames());
}

function tryMove(req: express.Request): boolean {
    const data = matchedData(req);
    const gameUUID = req.params.uuid;
    const user = req.session.user!;

    const fromSquare = Board.convertFromNotation(data.from);
    const toSquare = Board.convertFromNotation(data.to);

    // Move notation invalid for board size.
    if (!fromSquare || !toSquare) {
        return false;
    }

    const userSelectedPromotion = data.promotion;

    const result = GameService.tryMove(gameUUID, user, fromSquare, toSquare, userSelectedPromotion);

    switch (result) {
        case GameService.MoveResult.ACCEPTED: {
            notifyObservers(gameUUID, 'move', { from: data.from, to: data.to, promotion: userSelectedPromotion });
            return true;
        }
        case GameService.MoveResult.REJECTED: {
            return false;
        }
        case GameService.MoveResult.CHECKMATE: {
            notifyObservers(gameUUID, 'move', { from: data.from, to: data.to, promotion: userSelectedPromotion, ended: 'mate' });
            return true;
        }
    };

}

export function move(req: express.Request, res: express.Response) {
    if (validationResult(req).isEmpty() && tryMove(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
}

function tryResign(req: express.Request) {
    const user = req.session.user!;
    const gameUUID = req.params.uuid;

    if (GameService.tryResign(gameUUID, user)) {
        notifyObservers(gameUUID, 'resign', { resigned: user });
        return true;
    } else {
        return false;
    }
}

export function resignGame(req: express.Request, res: express.Response) {
    if (tryResign(req)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
}

export function join(req: express.Request, res: express.Response) {
    const uuid = req.params.uuid;

    const userJoining = req.session.user!;

    if (GameService.tryJoin(uuid, userJoining)) {
        // User was able to join game: notify host, create an observer list for game subscribers.
        gameObservers.set(uuid, []);
        const hostNotify = joinObservers.get(uuid);

        if (hostNotify) {
            hostNotify.res.write('event: message\ndata:\n\n'); // on req.end, we close res.
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
}

export function create(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(403);
        return;
    }

    const data = matchedData(req);
    const user = req.session.user!;

    let hostPrefer: Color | undefined = undefined;
    if (data.color === 'w') {
        hostPrefer = Color.White;
    } else if (data.color === 'b') {
        hostPrefer = Color.Black;
    }

    const uuid = GameService.createGame(user, hostPrefer);
    if (uuid.length > 0) {
        res.send(uuid);
    } else {
        res.sendStatus(403);
    }
}

export function subscribe(req: express.Request, res: express.Response) {
    addGameObserver(req, res, req.params.uuid);
}

// Notify host when player joins their open game.
export function hostWaiting(req: express.Request, res: express.Response) {
    addJoinObserver(req, res, req.params.uuid);
}








interface Observer {
    id: string;
    res: express.Response;
}

const joinObservers = new Map<string, Observer>();

function createObserver(res: express.Response): Observer {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);
    return { id: randomUUID(), res: res };
}

function addJoinObserver(req: express.Request, res: express.Response, uuid: string) {
    const observer = createObserver(res);
    joinObservers.set(uuid, observer);

    req.on('close', () => {
        // could use index in array as an id and swap-pop
        console.log(`${observer.id} closed sse connection.`);

        observer.res.write('data:\n\n');
        observer.res.end();
        joinObservers.delete(uuid);
    })
}

function addGameObserver(req: express.Request, res: express.Response, uuid: string) {
    const observer = createObserver(res);
    gameObservers.get(uuid)?.push(observer);

    req.on('close', () => {
        // could use index in array as an id and swap-pop
        console.log(`${observer.id} closed sse connection.`);

        const currObservers = gameObservers.get(uuid);
        if (currObservers) {
            gameObservers.set(uuid, currObservers.filter(o => o.id !== observer.id));
        }
    })
}

function notifyObservers(uuid: string, event: string, data: any) {
    const observerList = gameObservers.get(uuid);

    if (!observerList) {
        return;
    }

    const message = 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n';
    observerList.forEach(o => o.res.write(message));
}

export function getGameState(req: express.Request, res: express.Response) {
    const activeGame = GameService.getActiveGame(req.params.uuid);

    if (activeGame) {
        res.send(JSON.stringify(activeGame));
    } else {
        res.sendStatus(404);
    }
}
