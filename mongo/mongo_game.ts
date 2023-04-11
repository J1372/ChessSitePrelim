import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
    uuid: {
        type: mongoose.Schema.Types.UUID,
        required: true
    },

    white: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
    black: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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


export const MongoGame = mongoose.model('Game', GameSchema);
