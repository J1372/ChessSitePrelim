import express from 'express';
import {User} from '../mongo/user.js'
import mongoose from 'mongoose';
import { matchedData, validationResult } from 'express-validator';

import * as UserService from '../services/users_service.js'

function logUserIn(req: express.Request, res: express.Response, username: string, id: mongoose.Types.ObjectId) {
    req.session.user = username;
    req.session.mongoId = id.toString();

    res.redirect('/home');
}

export async function createAccountHandler(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(403);
        return;
    }

    const data = matchedData(req);

    const verifyError = await UserService.canCreateAccount(data.user, data.pass);
    if (verifyError !== '') {
        // The user should not be able to create an account with the given user and pass.
        // The reason is given in the returned string.
        res.render('register_page', { error: verifyError });
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
        res.sendStatus(403);
        return;
    }

    const data = matchedData(req);
    const correctPass = await UserService.verifyLogin(data.user, data.pass);

    if (correctPass) {
        const userInfo = await User.findOne({name: data.user}).select('_id').exec();
        logUserIn(req, res, data.user, userInfo!._id);
    } else {
        res.render('login_page', { error: true });
    }
}

export function logoutHandler(req: express.Request, res: express.Response) {
    req.session.destroy(_ => {
        res.redirect('/home'); // todo should redirect to home / the page where user logged out instead.
    });
}

export async function userPage(req: express.Request, res: express.Response) {
    const getPageOf = req.params.user; // the user we are getting the profile page of.
    const sessionUser = req.session.user; // current session's user

    const pageInfo = 
    {
        pageUser: getPageOf,
        sessionUser: sessionUser,
    } as any;
    

    const userStatsPromise = UserService.getStats(getPageOf)
    .then(async stats => {
        if (stats) {
            pageInfo.profileWins = stats.wins;
            pageInfo.profileDraws = stats.draws;
            pageInfo.profileLosses = stats.losses

            if (sessionUser && sessionUser !== getPageOf) {
                const userHistory = await UserService.getHistoryBetween(sessionUser, getPageOf);
                if (userHistory) {
                    pageInfo.history = userHistory;
                }
            }
        }
    })

    const gameHistoryPromise = UserService.getLatestGames(getPageOf, 10)
    .then(games => {
        pageInfo.games = games;
    });

    await Promise.all([userStatsPromise, gameHistoryPromise]);

    res.render('user_page', pageInfo);
}
