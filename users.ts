import express from 'express';
import * as db from './database.js'

export function logoutHandler(req: express.Request, res: express.Response) {
    req.session.destroy(_ => {
        res.redirect('/home'); // todo should redirect to home / the page where user logged out instead.
    });
}

export async function userPage(req: express.Request, res: express.Response) {
    const user = req.params.user;
    const getPageOf = user; // the user we are getting the profile page of.
    const sessionUser = req.session.user; // current session's user

    const pageInfo = 
    {
        pageUser: getPageOf,
        sessionUser: sessionUser,
    } as any;

    const stats = await db.getUserStats(user);
    if (stats) {
        pageInfo.profileWins = stats.wins;
        pageInfo.profileWins = stats.wins;
        pageInfo.profileDraws = stats.draws;
        pageInfo.profileLosses = stats.losses;
    }

    res.render('user_page', pageInfo);
}