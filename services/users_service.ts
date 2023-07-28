import * as bcrypt from 'bcrypt';
import { User } from '../mongo/user.js';
import { UsersGameHistory } from '../mongo/users_game_history.js';
import { MongoGame } from '../mongo/mongo_game.js';

export async function createAccount(user: string, pass: string) {
    const hashedPass = await bcrypt.hash(pass, 10);

    const newUser = new User({
        name: user,
        pass: hashedPass
    });

    return newUser.save();
}

export async function canCreateAccount(user: string, pass: string) {
    if (user.length < 3 || user.length > 16) {
        return "Username length must be in the range [3, 16].";
    }

    const firstChar = user[0];

    if (!firstChar.match('[a-z]|[A-Z]')) {
        return "Username must start with a letter.";
    }

    if (pass.length == 0) {
        return "No password entered.";
        
    }

    if (pass.length < 7) {
        return "Password too short (min = 7 characters).";
        
    }

    // bcrypt has a max password length restriction of 72 bytes.
    if (pass.length > 72) {
        return "Password too long (max = 72 characters).";
        
    }

    if (await User.exists({name: user}).exec()) {
        return "User already exists.";
    }

    return '';
}

export async function verifyLogin(username: string, password: string): Promise<boolean> {
    const row = await User.findOne({name: username}).select('pass').exec();

    if (row) {
        const hashedPass = row.pass;
        return bcrypt.compare(password, hashedPass);
    } else {
        console.log(`Could not find ${username} in the database.`);
        return false;
    }
}



export async function getHistoryBetween(user1: string, user2: string) {
    const [id1, id2] = await Promise.all([User.findOne({name: user1}).select('_id'),
                                          User.findOne({name: user2}).select('_id')]);

    if (id1 == undefined || id2 == undefined) {
        return null;
    } else {
        return UsersGameHistory.between(id1._id, id2._id);
    }
}


export function getStats(name: string) {
    return User.findOne({ name: name})
        .select('wins draws losses').exec()
        .then(stats => {
            if (stats) {
                return {wins: stats.wins, draws: stats.draws, losses: stats.losses};
            } else {
                return null;
            }
        });
}

export async function getLatestGames(name: string, amount: number) {
    return User.findOne({ name: name})
        .select('_id')
        .select({ gameHistory: { $slice: -amount }}).exec()
        .then(gameIds => {
            if (gameIds) {
                return MongoGame.find({ _id : { $in: gameIds.gameHistory } })
                    .select('_id white black result dueTo started ended')
                    .sort({ started: -1 }).exec();
            } else {
                return [];
            }
        })
        .then(async games => {
            // Build user game history info for the page.
            const gamesInfo = [];
            for (const game of games) {
                const gameInfo = {
                    result: game.result,
                    dueTo: game.dueTo,
                    started: game.started,
                    ended: game.ended,
                } as any;

                if (game._id.equals(game.white)) {
                    gameInfo.white = name;
                    const dbRes = await User.findById(game.black).select('name').exec();
                    gameInfo.black = dbRes!.name;
                } else {
                    gameInfo.black = name;
                    const dbRes = await User.findById(game.white).select('name').exec();
                    gameInfo.white = dbRes!.name;
                }

                gamesInfo.push(gameInfo);
            };
            return gamesInfo;
        })
        .catch(err => console.log(err));
}
