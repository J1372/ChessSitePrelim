import { Color } from "./color";
import { TimeControl } from "./time_control";

// A posting for a game that is looking for another player.
export class GamePost {
    uuid: string; // length = 16

    host: string; // user that wants to create the game.
    timeControl: TimeControl;

    // Date that the game was made available for joining.
    posted: Date;

    // Color that the host will play as.
    hostPlayAs?: Color;

    constructor(uuid: string, host: string, timeControl: TimeControl, hostPlayAs?: Color) {
        this.host = host;
        this.uuid = uuid;
        this.timeControl = timeControl;
        this.posted = new Date(); // could use Date.now instead
        this.hostPlayAs = hostPlayAs;
    }

}