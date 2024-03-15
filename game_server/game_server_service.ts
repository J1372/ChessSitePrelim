import { GamePost, Move } from 'chessgameplay';
import { Game } from 'chessgameplay';
import { Color } from 'chessgameplay';
import { User } from '../mongo/user.js';
import { UsersGameHistory } from '../mongo/users_game_history.js';
import { MongoGame } from '../mongo/mongo_game.js';
import mongoose from 'mongoose';

// Games being played now.
// Can be changed to array now with websockets.
const activeGames = new Map<string, Game>();

export enum MoveResult {
    REJECTED = 0,
    ACCEPTED,
    CHECKMATE
}

export const getActiveGameCount = () => activeGames.size;

export function tryMove(uuid: string, player: string, move: Move): MoveResult {
    const game = activeGames.get(uuid);

    // No game with uuid that is currently being played.
    if (!game) return MoveResult.REJECTED;

    // Check if user can actually move where they want to go.
    if (!game.canMove(player, move)) return MoveResult.REJECTED;

    game.move(move);

    // Move was accepted, check if move caused checkmate.

    if (game.userWon(player)) {
        endGame(game);
        storeGame(game, game.getColor(player), 'M', new Date());

        return MoveResult.CHECKMATE;
    } else {
        return MoveResult.ACCEPTED;
    }
}

export function tryResign(uuid: string, player: string): boolean {
    const game = activeGames.get(uuid);

    if (game && game.isPlayer(player)) {
        const winner = Color.opposite(game.getColor(player));
        endGame(game);
        storeGame(game, winner, 'R', new Date());

        return true;
    } else {
        return false;
    }
}


function endGame(game: Game) {
    activeGames.delete(game.uuid);
    // await store to db.
}


async function storeGame(game: Game, winnerColor: Color, dueTo: string, ended: Date) {

    const updatePlayerWinStats = (game: Game, winnerColor: Color) => {
        if (winnerColor === Color.White) {
            return Promise.all([User.addWin(game.white), User.addLoss(game.black)]);
        } else {
            return Promise.all([User.addWin(game.black), User.addLoss(game.white)]);
        }
    }

    updatePlayerWinStats(game, winnerColor)
    .then(([winner, loser]) => {
        console.log("Updated users' individual stats.")
        
        const winnerId = winner!._id;
        const loserId = loser!._id;

        UsersGameHistory.updateHistories(winnerId, loserId)
        .then(_ => console.log('Updated player histories.'))
        .catch(console.log);

        let whiteId: mongoose.Types.ObjectId;
        let blackId: mongoose.Types.ObjectId;
        let result: string;
        if (winnerColor === Color.White) {
            result = 'W';
            whiteId = winnerId;
            blackId = loserId;
        } else {
            result = 'B';
            whiteId = loserId;
            blackId = winnerId;
        }

        // Create the actual game.
        const newGame = new MongoGame({
            uuid: game.uuid,
            white: whiteId,
            black: blackId,
            result: result,
            dueTo: dueTo,
            started: game.started,
            ended: ended
        });

        newGame.save()
        .then(savedGame => {
            console.log('Saved game to db.')
            
            // Add game to players' histories.
            return Promise.all([
                User.addGame(winnerId, savedGame._id),
                User.addGame(loserId, savedGame._id),
            ]);
        })
        .then(_ => console.log("Added game to users' histories."))
        .catch(console.log);
    })
    .catch(console.log);
}

export function createGame(uuid: string, host: string, otherPlayer: string, hostPrefer: Color | undefined, gameType: string) {
    const game = Game.fromPost(new GamePost(uuid, host, hostPrefer), otherPlayer); // todo gamepost should take gametype in ctor.
    activeGames.set(uuid, game);
}

export async function getLoggedInUser(token: string) : Promise<string> {
    const doc = await mongoose.connection.db.collection('sessions')
        .findOne({ _id: token }, { projection: { session: 1 } });
    
    if (doc !== null) {
        console.log(doc.session);
        const sessionInfo = JSON.parse(doc.session);
        console.log(sessionInfo);
        console.log(sessionInfo.user);

        return sessionInfo.user ? sessionInfo.user : '';
    } else {
        return '';
    }
}

export const getActiveGame = (uuid: string) => activeGames.get(uuid);
