import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    pass: {
        type: String,
        required: true
    },

    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    },

    wins: {
        type: Number,
        default: 0,
    },

    draws: {
        type: Number,
        default: 0,
    },

    losses: {
        type: Number,
        default: 0,
    },

    gameHistory: [{type: mongoose.Schema.Types.ObjectId, ref: 'Game'}]

},
{
    statics: {

        addWin(user: string) {
            return this.findOneAndUpdate({ name: user }, { $inc: { wins: 1 }}).select('_id').exec();
        },

        addLoss(user: string) {
            return this.findOneAndUpdate({ name: user }, { $inc: { losses: 1 }}).select('_id').exec();
        },

        addGame(userId: mongoose.Types.ObjectId, gameId: mongoose.Types.ObjectId) {
            return this.findByIdAndUpdate(userId, { $push: { gameHistory: gameId }});
        }
    }
});

export const User = mongoose.model('User', UserSchema);
