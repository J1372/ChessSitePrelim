import mongoose from "mongoose";
import { User } from "./user.js";
import { GamePost } from "chessgameplay";

interface GameCreationDetails {
    uuid: string,
    creator: string,
    hostPlaysAs: string,
    gameType: string,
}

const OpenGameSchema = new mongoose.Schema({
    // additional id.

    uuid: {
        type: mongoose.Schema.Types.UUID,
        required: true
    },

    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    /*
    denormalized data: might optimize requests for open games list.
    update anomaly: if allow username changes, would need to still verify using ids on game join. 
                        additionally, update opengames on user's name change.
    creatorName: { 
        type: String,
        required: true
    },*/
    
    hostPlaysAs: {
        type: String,
        enum: ['W', 'B', 'E'],
        required: true,
    },

    gameType: {
        type: String,
        required: true,
    },

    created: {
        type: Date,
        default: Date.now,
        immutable: true,
    },


},
{
    statics: {

        // Returns an open game that can be joined, 
        async findOneAndJoin(uuid: string, joiner: string): Promise<GameCreationDetails | null> {
            const joinerId = (await User.findOne({ name: joiner }).select('_id').exec())!._id;

            const doc = await this.findOneAndDelete({ uuid: uuid, creator: { $ne: joinerId } })
                .populate('creator', 'name')
                .select('creator hostPlaysAs gameType').exec();

            if (!doc) {
                return null;
            } else {
                return { uuid: uuid, creator: doc.creator.name, hostPlaysAs: doc.hostPlaysAs, gameType: doc.gameType };
            }
        },

        // Get all open game posts for display.
        async getGamePosts(): Promise<Array<GamePost>> {
            const docs = await this.find()
                .populate('creator', 'name')
                .select('uuid hostPlaysAs gameType created').exec();
            
            return docs.map(doc => {
                return { uuid: doc.uuid.toString(), host: doc.creator.name, hostPlaysAs: doc.hostPlaysAs, gameType: doc.gameType, posted: doc.created }
            })
        }
}});

export const MongoOpenGame = mongoose.model('OpenGame', OpenGameSchema);
