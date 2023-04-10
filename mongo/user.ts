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

    otherUsersHistory: {
        type: Map,
        of: {
            wins: Number,
            draws: Number,
            losses: Number
        },

        default: new Map
    }
    

});

export const User = mongoose.model('User', UserSchema);
