import express from 'express';
import {User} from './mongo/user.js'
import { MongoGame } from './mongo/mongo_game.js';
import { UsersGameHistory } from './mongo/users_game_history.js';
import mongoose from 'mongoose';

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
    
    
    const pageUserInfo = await User.findOne({ name: getPageOf})
        .select('_id wins draws losses')
        .select({ gameHistory: { $slice: 10 }}).exec();

    if (pageUserInfo) {
        pageInfo.profileWins = pageUserInfo.wins;
        pageInfo.profileDraws = pageUserInfo.draws;
        pageInfo.profileLosses = pageUserInfo.losses;

        if (pageUserInfo.gameHistory.length !== 0) {
            // Request games from db and start loading.
            const gamePromise = MongoGame.find({ _id : { $in: pageUserInfo.gameHistory } })
                .select('white black result dueTo started ended')
                .sort({ started: -1 }).exec()
                .then(async games => {
                    // Build user game history info for the page.
                    pageInfo.games = [];
                    for (const game of games) {
                        const gameInfo = {
                            result: game.result,
                            dueTo: game.dueTo,
                            started: game.started,
                            ended: game.ended,
                        } as any;

                        if (pageUserInfo._id.equals(game.white)) {
                            gameInfo.white = getPageOf;
                            const dbRes = await User.findById(game.black).select('name').exec();
                            gameInfo.black = dbRes!.name;
                        } else {
                            gameInfo.black = getPageOf;
                            const dbRes = await User.findById(game.white).select('name').exec();
                            gameInfo.white = dbRes!.name;
                        }

                        pageInfo.games.push(gameInfo);
                    };
                })
                .catch(err => console.log(err));

            
            // If sess user logged in and this is not their page:
            // Load their past game history with the page user.
            if (req.session.mongoId) {
                const myId = new mongoose.Types.ObjectId(req.session.mongoId);
                if (!myId.equals(pageUserInfo._id)) {
                    const usersHistory = await UsersGameHistory.between(myId, pageUserInfo._id);
                    if (usersHistory) {
                        pageInfo.history = usersHistory;
                    }
                }
            }

            // Wait if games are not done loading.
            await gamePromise;
        }
    }

    res.render('user_page', pageInfo);

}
