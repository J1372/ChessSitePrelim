import mongoose from "mongoose"
await mongoose.connect('mongodb://127.0.0.1:27017/Chess');

import * as games from './games.js'
import * as users from './controllers/users_controller.js'
import * as path from 'path';
import * as valid from './validation.js';

import { fileURLToPath } from 'url';

import express from 'express';
import sessions from 'express-session';
import MongoStore from "connect-mongo";

declare module "express-session" {
    interface SessionData {
      user: string;
      mongoId: string, // cannot use ObjectId due to way sessions work.
    }
  }

const app = express();
const port = 8080;

const jsonParser = express.json();
const urlParser = express.urlencoded({extended: true});

const secret = "HGHFFGHTUJFY";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const gameplayPath = path.join(projectDir, 'gameplay');

const front_path = path.join(projectDir, 'frontend');
const stylePath = path.join(front_path, 'style', 'bin');
const scriptPath = path.join(front_path, 'script');

app.use(express.static(stylePath));
app.use(express.static(scriptPath));
app.use(express.static(gameplayPath));
app.use(sessions({
    secret: secret,
    saveUninitialized: true,
    resave: false,

    store: MongoStore.create({
        client: mongoose.connection.getClient(),
        ttl: 60 * 10,
    })
}));

app.set('views', './views');
app.set('view engine', 'pug');

process.on('SIGINT', async (code) => {
    console.log("Stopping server.");
    await mongoose.disconnect();
    console.log("Closed database.");
    process.exit();
});

/*

    End setup.

*/




app.get('/', (req: express.Request, res: express.Response) => {
    res.render('home', { sessionUser: req.session.user})
});

app.get('/home', (req: express.Request, res: express.Response) => {
    res.render('home', { sessionUser: req.session.user });
});

app.get('/login', (req: express.Request, res: express.Response) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('login_page');
    }
});

app.get('/create-account', (req: express.Request, res: express.Response) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('register_page');
    }
});

// users
app.post('/users', valid.notLoggedIn, urlParser, valid.loginRegBasicSchema, users.createAccountHandler);
app.post('/users/login', valid.notLoggedIn, urlParser, valid.loginRegBasicSchema, users.loginHandler);
app.post('/users/logout', valid.loggedIn, users.logoutHandler);
app.get('/users/:user', users.userPage);


// games
app.post('/games', valid.loggedIn, jsonParser, valid.createGameSchema, games.create);
app.get('/games/open-games', games.getOpenGames);
app.put('/games/:uuid', valid.loggedIn, games.join);
app.get('/games/:uuid', games.gamePage);
app.get('/games/:uuid/subscriptions', games.subscribe);
app.get('/games/:uuid/waiting', valid.loggedIn, games.hostWaiting);
app.post('/games/:uuid/moves', valid.loggedIn, jsonParser, valid.moveSchema, games.move);
app.post('/games/:uuid/resign', valid.loggedIn, games.resignGame);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
