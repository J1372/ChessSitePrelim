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


async function storeGame(game: Game, winner: Color, dueTo: string, ended: Date) {
    // Get necessary info about players.
    const selectStr = '_id wins losses gameHistory';
    const [white, black] = await Promise.all([User.findOne({name: game.white}).select(selectStr).exec(),
                                              User.findOne({name: game.black}).select(selectStr).exec()]);
    
    // If game was actually played, neither should ever be null.
    if (!white || !black) {
        return;
    }

    let result = '';
    let winnerUpdate;
    let loserUpdate;
    if (winner === Color.White) {
        result = 'W';
        winnerUpdate = white;
        loserUpdate = black;
    } else {
        result = 'B';
        winnerUpdate = black;
        loserUpdate = white;
    }


    // Update actual user wins
    ++winnerUpdate.wins;
    ++loserUpdate.losses;
    

    // Update players' history with each other.
    const winnerId = winnerUpdate._id;
    const key = UsersGameHistory.key(white._id, black._id);
    UsersGameHistory.findById(key).select('user1Wins user2Wins').exec()
    .then(history => {
        // Create a new history if players have never played together before.
        if (!history) {
            history = new UsersGameHistory({
                _id: key,
                user1Wins: 0,
                draws: 0,
                user2Wins: 0,
            });
        }
        
        if (key.a.equals(winnerId)) {
            ++history.user1Wins;
        } else {
            ++history.user2Wins;
        }
    
        history.save()
        .then(_ => console.log('Updated player histories.'))
        .catch(console.log);
    })
    .catch(console.log);



    // Create the actual game.
    const newGame = new MongoGame({
        uuid: game.uuid,
        white: white._id,
        black: black._id,
        result: result,
        dueTo: dueTo,
        started: game.started,
        ended: ended
    });

    newGame.save()
    .then(savedGame => {
        console.log('Saved game to db.')
        
        // Add game to players' histories.
        white.gameHistory.push(savedGame._id);
        black.gameHistory.push(savedGame._id);

        Promise.all([white.save(), black.save()])
        .then(_ => console.log('Updated player info.'))
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
