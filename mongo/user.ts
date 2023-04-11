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

});

export const User = mongoose.model('User', UserSchema);
