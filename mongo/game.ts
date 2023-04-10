import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
    uuid: {
        type: mongoose.Schema.Types.UUID,
        required: true
    },

    white: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    black: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    result: {
        type: String,
        enum: ['W', 'B'],
    },
    
    dueTo: {
        type: String,
        enum: ['M', 'R'],
    },

    started: {
        type: Date,
        required: true
    },

    ended: {
        type: Date,
        required: true
    },

});


export const Game = mongoose.model('Game', GameSchema);
