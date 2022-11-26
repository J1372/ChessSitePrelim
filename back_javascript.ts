import {db} from "./database.js"
import * as authentication from "./authentication.js"


// http used since server and client ran on localhost.

import * as path from 'path';

import sqlite3 from 'sqlite3';

import express from 'express';
import sessions from 'express-session';

declare module "express-session" {
    interface SessionData {
      user: string;
    }
  }

import sqliteStoreFactory from "express-session-sqlite";

const sqliteStore = sqliteStoreFactory.default(sessions);

const app = express();

import { fileURLToPath } from 'url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const port = 8080;


const front_path = path.join(projectDir, 'frontend');
const login_path = path.join(projectDir, 'frontend', 'login', 'login.html');
const homePath = path.join(projectDir, 'frontend', 'home', 'home.html');

const secret = "HGHFFGHTUJFY";

app.use(express.static(front_path));
app.use(sessions({
    secret: secret,
    saveUninitialized: true,
    resave: false,

    store: new sqliteStore({
        driver: sqlite3.Database,
        path: './db/chessDB.db',
        ttl: 1000 * 60 * 10,
        prefix: "sql_session:",
    })
}));

//app.use(cookieParser()); // maybe come before static server


process.on('SIGINT', async (code) => {
    console.log("Stopping server.");
    await db.close();
    console.log("Closed database.");
    process.exit();
});



/*

    End setup.

*/

const parserMy = express.urlencoded({extended: true});


app.get('/', (req: express.Request, res: express.Response) => {
    const curTime = new Date();
    console.log(`New connection: ${curTime.toLocaleString()}`);
    console.log(`New connection: ${curTime.toUTCString()}`);
    
    res.sendFile(homePath);
});

app.get('/login', (req: express.Request, res: express.Response) => {
    res.sendFile(login_path);
});

app.get('/home', (req: express.Request, res: express.Response) => {
    console.log("Req.cookies:");
    console.log(req.cookies);
    
    console.log("Req.signedCookies:");
    console.log(req.signedCookies);
    
    console.log("Server session storage:")

    const session = req.session;
    if (req.session.user) {
        console.log(`Session ID: ${session.id}`)
        console.log(`User: ${session.user}`);
        console.log(`Cookie: ${session.cookie}`);
    } else {
        console.log(`Session ID: ${session.id}`)
        console.log(`User: None`);
        console.log(`Cookie: ${session.cookie}`);
    }
    
    res.sendFile(homePath);

});

app.post('/login-attempt', parserMy, authentication.loginHandler);

app.post('/create-account', parserMy, (req: express.Request, res: express.Response) => {
    res.sendFile(login_path);
});

app.post('/create-account-attempt', parserMy, authentication.createAccountHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
