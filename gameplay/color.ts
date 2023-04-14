export enum Color {
    White,
    Black,
}

export namespace Color {
    export function opposite(color: Color) {
        return color === Color.White ? Color.Black : Color.White;
    }

    export function toString(color: Color) {
        if (color === Color.White) {
            return 'White';
        } else if (color === Color.Black) {
            return 'Black';
        } else {
            return null;
        }
    }
}