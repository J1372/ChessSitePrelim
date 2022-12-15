export enum Color {
    White,
    Black,
}

export namespace Color {
    export function opposite(color: Color) {
        return color === Color.White ? Color.Black : Color.White;
    }
}