import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite'


export const db: sqlite.Database<sqlite3.Database, sqlite3.Statement> = await sqlite.open({
    filename: './db/chessDB.db',
    driver: sqlite3.Database
  });
