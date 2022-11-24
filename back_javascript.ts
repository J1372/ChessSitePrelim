import {db} from "./database.js"
import {sessions, clearInactiveSessions, msToMinutes} from "./sessions.js"
import * as authentication from "./authentication.js"

// http used since server and client ran on localhost.

import * as path from 'path';

import express from 'express';
import cookieParser from 'cookie-parser'

const app = express();

import { fileURLToPath } from 'url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const port = 8080;


const front_path = path.join(projectDir, 'frontend');
const login_path = path.join(projectDir, 'frontend', 'login', 'login.html');
const homePath = path.join(projectDir, 'frontend', 'home', 'home.html');

const secret = "HGHFFGHTUJFY";

app.use(express.static(front_path));
app.use(cookieParser()); // maybe come before static server


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

    console.log("Req.headers.cookies:");
    console.log(req.headers.cookies);
    
    console.log("Server session storage:")
    sessions.forEach((info, id, map) => {
        console.log(`SessID:       ${id}`);
        console.log(`User:         ${info.user}`);
        console.log(`LastActive:   ${info.lastActivity.toLocaleString()}`);
    });

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


setInterval(clearInactiveSessions, 0.5 *  60 * 1000); // every 30 seconds clear inactive users.
