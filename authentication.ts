import {db, userExists} from "./database.js";
import express from 'express';
import * as bcrypt from 'bcrypt';

function makeid(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    for (let i = 0; i < length; ++i) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
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

export async function loginHandler(req: express.Request, res: express.Response) {
    console.log(req.body);

    const user = req.body['username'];
    const pass = req.body['password'];

    const correctPass = await verifyLogin(user, pass);

    if (correctPass === true) {
        req.session.user = user;
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
}

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



export async function createAccountHandler(req: express.Request, res: express.Response) {
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
        req.session.user = user;
    }
    
}
