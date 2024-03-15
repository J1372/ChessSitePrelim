import mongoose from "mongoose";

// used by usersGameHistorySchema static methods.
function getKey(id1: mongoose.Types.ObjectId, id2: mongoose.Types.ObjectId) {
    const sortedIds = [id1, id2].sort();
    return { a: sortedIds[0], b: sortedIds[1] };
}

// Id is two user references, where a < b.
// Represents the game history between two users.
const usersGameHistorySchema = new mongoose.Schema({
    _id: {
        a: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        b: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    },

    user1Wins: { // = user2's losses
        type: Number,
        required: true
    },

    draws: {
        type: Number,
        required: true
    },
    
    user2Wins: { // = user1's losses
        type: Number,
        required: true
    }

    // Games played together = user1Wins + draws + user2Wins

},
{
    statics: {

        /**
         * Returns wins, draws, losses of user with id1 against user with id2,
         *  if they have played together.
         * 
         * Otherwise, returns null.
         */
        async between(id1: mongoose.Types.ObjectId, id2: mongoose.Types.ObjectId) {
            const key = getKey(id1, id2);

            return this.findById(key).select('user1Wins draws user2Wins').exec()
            .then(history => {
                if (history) {
                    // Set wins losses from perspective of the first parameter user.
                    if (id1 < id2) {
                        var wins = history.user1Wins;
                        var losses = history.user2Wins;
                    } else {
                        var wins = history.user2Wins;
                        var losses = history.user1Wins;
                    }

                    return { wins: wins, draws: history.draws, losses: losses };
                } else {
                    return null;
                }
            });
        },
        
        async findEntry(id1: mongoose.Types.ObjectId, id2: mongoose.Types.ObjectId) {
            const key = getKey(id1, id2);
            return this.findById({_id: key}).select('user1Wins draws user2Wins').exec();
        },

        updateHistories(winnerId: mongoose.Types.ObjectId, loserId: mongoose.Types.ObjectId) {
            const key = getKey(winnerId, loserId);
            const options = { upsert: true, setDefaultsOnInsert: true };
            
            if (key.a.equals(winnerId)) {
                return this.findByIdAndUpdate(key, { $inc: { user1Wins: 1 } }, options).exec();
            } else {
                return this.findByIdAndUpdate(key, { $inc: { user2Wins: 1 } }, options).exec();
            }
        }
}
});

export const UsersGameHistory = mongoose.model('UsersGameHistory', usersGameHistorySchema);
