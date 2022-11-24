import * as sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';
// http used since server and client ran on localhost.

import * as path from 'path';

import express from 'express';
//import * as cookieParser from 'cookie-parser'
var cookieParser = require('cookie-parser')
import * as bcrypt from 'bcrypt';

const app = express();

const port = 8080;


const front_path = path.join(__dirname, 'frontend');
const login_path = path.join(__dirname, 'frontend', 'login', 'login.html');

let sessions = new Map<string, string>();

const secret = "HGHFFGHTUJFY";

app.use(express.static(front_path));
app.use(cookieParser());

sqlite.open({
    filename: './db/chessDB.db',
    driver: sqlite3.Database
  }).then((db) => {
    
process.on('SIGINT', (code)=> {
    console.log("Stopping server.");
    db.close();
    process.exit();
});



/*

    End setup.

*/



async function userExists(username: string) {
    const stmt = `SELECT *
                    FROM USER
                    WHERE name = ?`;

    const row = await db.get(stmt, [username]);

    if (row) {
        console.log(`${username} exists in the database.`);
        return true;
    } else {
        console.log(`${username} does not exist in the database.`);
        return false;
    }
}

async function verifyLogin(username: string, password: string): Promise<boolean> {
    
    const stmt = `SELECT password
                    FROM USER
                    WHERE name = ?`;


    const row = await db.get(stmt, [username]);

    if (row) {
        console.log(`Found ${username} in the database.`);
        const hashedPass = row.password;

        const match = await bcrypt.compare(password, hashedPass); 
        

        if (match) {
            console.log("Passwords matched.");
            return true;
        } else {
            console.log("Passwords did not match.");
            return false;
        }

    } else {
        console.log(`Could not find ${username} in the database.`);
        return false;
    }

}

function makeid(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    for (let i = 0; i < length; ++i) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

async function loginHandler(req: express.Request, res: express.Response) {
    console.log(req.body);

    const user = req.body['username'];
    const pass = req.body['password'];

    const correctPass = await verifyLogin(user, pass);

    if (correctPass === true) {
        const id = makeid(40);

        sessions.set(id, user);

        res.cookie("sessID", id);
        res.cookie("time", new Date().toLocaleString());

        res.send('Logged in!')
    } else {
        res.send('Incorrect login!')
    }
}


const parserMy = express.urlencoded({extended: true});



async function canCreateAccount(user: string, pass: string) {
    if (user.length < 3 || user.length > 32) {
        return "Username length must be in the range [3, 32].";
    }

    const firstChar = user[0];

    if (!firstChar.match('[a-z]|[A-Z]')) {
        return "Username must start with a letter.";
        
    }

    if (pass.length == 0) {
        return "No password entered.";
        
    }

    if (pass.length < 7) {
        return "Password too short (min = 7 characters).";
        
    }

    // bcrypt has a max password length restriction of 72 bytes.
    if (pass.length > 72) {
        return "Password too long (max = 72 characters).";
        
    }

    if (await userExists(user)) {
        return "User already exists.";
    }

    return '';
}


async function createAccountHandler(req: express.Request, res: express.Response) {
    console.log(req.body);

    const user: string = req.body['username'];
    const pass: string = req.body['password'];

    const verifyError = await canCreateAccount(user, pass);

    if (verifyError !== '') {
        // The user should not be able to create an account with the given user and pass.
        // The reason is given in the returned string.
        res.send(verifyError);
        return;
    }

    // User should be able to create an account with the given username and password.
    
    // Use bcrypt to hash password.
    const hashedPass = await bcrypt.hash(pass, 10);

    // Run the SQL statement to attempt to insert a user account with the username and hashed password into db.
    const stmt = `INSERT INTO USER (name, password) VALUES (?, ?)`;
    const result = await db.run(stmt, [user, hashedPass]);

    // lastID is used for insert statements. If insertion was not successful, it is undefined.
    if (result.lastID === undefined) {
        // User was allowed to create the account, but insertion into db failed.
        res.send('Account creation failed. Try again later.');
    } else {
        res.send({redirect: '/login'});
    }
    
}


const homePath = path.join(__dirname, 'frontend', 'home', 'home.html');

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
    sessions.forEach((user, id, map) => {
        console.log(`SessID: ${id}`);
        console.log(`User:   ${user}`);
    });

    res.sendFile(homePath);
});

app.post('/login-attempt', parserMy, loginHandler);

app.post('/create-account', parserMy, (req: express.Request, res: express.Response) => {
    res.sendFile(login_path);
});

app.post('/create-account-attempt', parserMy, createAccountHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

  });
