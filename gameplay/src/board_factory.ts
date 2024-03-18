import { Board } from "./board.js";
import { StandardBoard } from "./standard_board.js";


export default class BoardFactory {
    
    private static boardMap = new Map<string, [() => Board, (json: any) => Board]>([
        ['standard', [() => new StandardBoard(), (json) => StandardBoard.deserialize(json)]]
    ]);

    public static create(type: string) {
        const boardFuncs = BoardFactory.boardMap.get(type);

        if (boardFuncs) {
            const boardCtor = boardFuncs[0];
            return boardCtor();
        } else {
            return null;
        }
    }

    public static deserialize(type: string, json: any) {
        const boardFuncs = BoardFactory.boardMap.get(type);

        if (boardFuncs) {
            const boardDeserializer = boardFuncs[1];
            return boardDeserializer(json);
        } else {
            return null;
        }
    }
}
