import express from 'express';
import {User} from '../mongo/user.js'
import mongoose from 'mongoose';
import { matchedData, validationResult } from 'express-validator';

import * as UserService from '../services/users_service.js'

function logUserIn(req: express.Request, res: express.Response, username: string, id: mongoose.Types.ObjectId) {
    req.session.user = username;
    req.session.mongoId = id.toString();

    res.sendStatus(200);
}

export async function createAccountHandler(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(403).send('Malformed arguments.');
        return;
    }

    const data = matchedData(req);

    const verifyError = await UserService.canCreateAccount(data.user, data.pass);
    if (verifyError !== '') {
        // The user should not be able to create an account with the given user and pass.
        // The reason is given in the returned string.
        res.status(403).send(verifyError);
        return;
    }

    // User should be able to create an account with the given username and password.
    
    UserService.createAccount(data.user, data.pass)
    .then(newUser => {
        logUserIn(req, res, data.user, newUser._id);
    })
    .catch(err => {
        console.log(err);
        res.status(500).send('Account creation failed. Try again later.');
    });
}

export async function loginHandler(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.status(403).send('Malformed arguments.');
        return;
    }

    const data = matchedData(req);
    const correctPass = await UserService.verifyLogin(data.user, data.pass);

    if (correctPass) {
        const userInfo = await User.findOne({name: data.user}).select('_id').exec();
        logUserIn(req, res, data.user, userInfo!._id);
    } else {
        res.status(403).send('Could not login with the given info.');
    }
}

export function logoutHandler(req: express.Request, res: express.Response) {
    req.session.destroy(_ => {
        res.sendStatus(200);
    });
}

export async function getStats(req: express.Request, res: express.Response) {
    const stats = await UserService.getStats(req.params.user);
    if (stats) {
        res.send(stats);
    } else {
        res.sendStatus(404);
    }
}

export async function getRecentGames(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.status(403);
        return;
    }

    const data = matchedData(req);
    
    let mostRecentAmount = 10;
    if (data.max) {
        mostRecentAmount = Number.parseInt(data.max);
    }

    const latestGames = await UserService.getLatestGames(req.params.user, mostRecentAmount);

    res.send(JSON.stringify(latestGames));
}

export async function getHistoryUsers(req: express.Request, res: express.Response) {
    const user1 = req.params.user1;
    const user2 = req.params.user2;
    const history = await UserService.getHistoryBetween(user1, user2);

    if (history) {
        res.send(JSON.stringify(history));
    } else {
        res.sendStatus(404);
    }
}

