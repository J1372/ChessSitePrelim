import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';


export const db = await sqlite.open({
    filename: './db/chessDB.db',
    driver: sqlite3.Database
});


export async function userExists(user: string) {
    const stmt = `SELECT name
                  FROM user
                  WHERE name = ?`;

    const entry = await db.get(stmt, [user]);

    return entry !== undefined;
}