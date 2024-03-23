import express from 'express';
import { Color } from 'chessgameplay';
import { matchedData, validationResult } from 'express-validator';
import * as GameService from '../services/games_service.js'
import fetch from 'node-fetch';

if (process.env.GAME_SERVER_PROXY == undefined) {
    throw new Error("Missing env GAME_SERVER_PROXY")
}

export async function getOpenGames(_: express.Request, res: express.Response) {
    res.send(await GameService.getOpenGames());
}

export async function join(req: express.Request, res: express.Response) {
    const uuid = req.params.uuid;

    const userJoining = req.session.user!;

    const gameDetails = await GameService.tryJoin(uuid, userJoining);

    if (gameDetails) {
        // Game was created, tell game server.
        const gameServerToken = 'aaa';
        
        const data = {
            auth: gameServerToken,
            game: gameDetails,
            userJoining: userJoining
        }
        
        console.log('Sending request to game server.');
        fetch(`http://${process.env.GAME_SERVER_PROXY}/start-active-game?gameUUID=${gameDetails.uuid}`, { 
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).then(gameRes => {
            if (gameRes.ok) {
                console.log('Server accepted game creation request.');
                res.sendStatus(200);
            } else {
                console.log('Server rejected game creation request.');
                res.sendStatus(500);
            }
        }).catch(err => { 
            console.log(err);
            res.sendStatus(500);
        })
    } else {

        res.sendStatus(403);
    }
}

export async function create(req: express.Request, res: express.Response) {
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

    const uuid = await GameService.createGame(user, hostPrefer, 'Standard');
    if (uuid.length > 0) {
        res.send(uuid);
    } else {
        res.sendStatus(403);
    }
}
