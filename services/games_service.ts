import { GamePost } from 'chessgameplay';
import { Color } from 'chessgameplay';
import { MongoOpenGame } from '../mongo/mongo_open_game.js';
import { randomUUID } from 'crypto';
import { User } from '../mongo/user.js';

export function getOpenGames(): Promise<Array<GamePost>> {
    return MongoOpenGame.getGamePosts();
}

export async function tryJoin(uuid: string, player: string) {
    const openGame = await MongoOpenGame.findOneAndJoin(uuid, player);
    return openGame;
}

/** Returns uuid or empty string if game was not created. */ 
export async function createGame(host: string, hostPrefer: Color | undefined, gameType: string): Promise<string> {
    const uuid = randomUUID();

    const hostPreferChar = hostPrefer === undefined ? 'E' : Color.toString(hostPrefer).charAt(0);
    const hostId = (await User.findOne({ name: host }).select('_id').exec())!._id;
    const newGamePost = new MongoOpenGame({
        uuid: uuid,
        creator: hostId,
        hostPlaysAs: hostPreferChar,
        gameType: gameType
    });

    return newGamePost.save().then(_ => {
        return uuid;
    }).catch(err => '');
}
