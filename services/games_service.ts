import { Square } from 'chessgameplay';
import { Game } from 'chessgameplay';
import { GamePost } from 'chessgameplay';
import { pieceFactory } from 'chessgameplay';
import { Color } from 'chessgameplay';
import { User } from '../mongo/user.js';
import { UsersGameHistory } from '../mongo/users_game_history.js';
import { MongoGame } from '../mongo/mongo_game.js';
import { randomUUID } from 'crypto';

// Public games posted that can be joined by any user.
const openGames = new Map<string, GamePost>();
const openGamesList = new Array<GamePost>();

// Games being played now.
const activeGames = new Map<string, Game>();

export enum MoveResult {
    REJECTED = 0,
    ACCEPTED,
    CHECKMATE
}

export const getOpenGames = () => openGamesList;

export function tryMove(uuid: string, player: string, from: Square, to: Square, promotion: string | undefined): MoveResult {
    const game = activeGames.get(uuid);

    // No game with uuid that is currently being played.
    if (!game) return MoveResult.REJECTED;

    // Only allow making a move if logged the user is a player in the game.
    if (!game.isPlayer(player)) return MoveResult.REJECTED;

    // There is a game with uuid, and the user is a player in the game.

    // Check if player can actually move where they want to go.
    if (!game.canMove(player, from, to)) return MoveResult.REJECTED;

    // Get a list of promotions that the player must choose from if making this move.
    // If non-empty list, player must have chosen a promotion from this list.
    const forcedPromotions = game.getPromotions(from, to);

    // if game.mustPromote(move) then game.tryPromote(square, pieceString) and if fail then return.

    if (forcedPromotions.length > 0) {
        // Move requires promotion, user request does not specify a promotion.
        if (!promotion) return MoveResult.REJECTED;

        // Player tried to promote, specified promotion is not an option.
        if (!forcedPromotions.includes(promotion)) return MoveResult.REJECTED;
        

        // Create new piece.
        const promotedTo = pieceFactory(promotion, game.getColor(player));

        // Factory failed to produce a Piece. Should only happen if piece string is invalid.
        if (!promotedTo) return MoveResult.REJECTED;

        game.move(from, to);
        game.promote(to, promotedTo);
    } else {
        game.move(from, to);
    }

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
    // notify end game observer (controller)?

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

export function tryJoin(uuid: string, player: string): boolean {
    const gamePost = openGames.get(uuid);

    if (gamePost) {
        if (player === gamePost.host) {
            // Host trying to join their own game.
            return false;
        }

        // Remove game from opengames and start new game.
        openGames.delete(uuid);
        openGamesList.splice(openGamesList.findIndex(post => post.uuid === uuid), 1)

        const newGame = Game.fromPost(gamePost, player);
        activeGames.set(uuid, newGame);
        return true;
    } else {
        return false;
    }
}

/** Returns uuid or empty string if host not allowed to create game. */ 
export function createGame(host: string, hostPrefer: Color | undefined): string {
    const uuid = randomUUID();
    const created = new GamePost(uuid, host, hostPrefer);

    openGames.set(uuid, created);
    openGamesList.push(created);
    return uuid;
}

export const getActiveGame = (uuid: string) => activeGames.get(uuid);
