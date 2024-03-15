import { Color } from "./color.js";

// A posting for a game that is looking for another player.
export class GamePost {
    uuid: string; // length = 16

    host: string; // user that wants to create the game.

    // Date that the game was made available for joining.
    posted: Date;

    // Color that the host will play as.
    hostPlayAs?: Color;

    constructor(uuid: string, host: string, hostPlayAs?: Color) {
        this.host = host;
        this.uuid = uuid;
        this.posted = new Date(); // could use Date.now instead
        this.hostPlayAs = hostPlayAs;
    }

}