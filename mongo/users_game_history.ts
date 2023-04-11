import mongoose from "mongoose";

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

});


export const UsersGameHistory = mongoose.model('UsersGameHistory', usersGameHistorySchema);
