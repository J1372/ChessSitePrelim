import express from 'express';
import * as bcrypt from 'bcrypt';
import {User} from './mongo/user.js'
import mongoose from 'mongoose';
import { matchedData, validationResult } from 'express-validator';

function logUserIn(req: express.Request, res: express.Response, username: string, id: mongoose.Types.ObjectId) {
    req.session.user = username;
    req.session.mongoId = id.toString();

    res.redirect('/home');
}

async function verifyLogin(username: string, password: string): Promise<boolean> {
    const row = await User.findOne({name: username}).select('pass').exec();

    if (row) {
        const hashedPass = row.pass;
        return bcrypt.compare(password, hashedPass);
    } else {
        console.log(`Could not find ${username} in the database.`);
        return false;
    }

}

export async function loginHandler(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(403);
        return;
    }

    const data = matchedData(req);
    const correctPass = await verifyLogin(data.user, data.pass);

    if (correctPass) {
        const userInfo = await User.findOne({name: data.user}).select('_id').exec();
        logUserIn(req, res, data.user, userInfo!._id);
    } else {
        res.render('login_page', { error: true });
    }
}

async function canCreateAccount(user: string, pass: string) {
    if (user.length < 3 || user.length > 16) {
        return "Username length must be in the range [3, 16].";
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

    if (await User.exists({name: user}).exec()) {
        return "User already exists.";
    }

    return '';
}



export async function createAccountHandler(req: express.Request, res: express.Response) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(403);
        return;
    }

    const data = matchedData(req);
    const verifyError = await canCreateAccount(data.user, data.pass);

    if (verifyError !== '') {
        // The user should not be able to create an account with the given user and pass.
        // The reason is given in the returned string.
        res.render('register_page', { error: verifyError });
        return;
    }

    // User should be able to create an account with the given username and password.
    
    // Use bcrypt to hash password.
    const hashedPass = await bcrypt.hash(data.pass, 10);

    const newUser = new User({
        name: data.user,
        pass: hashedPass
    });

    newUser.save()
    .then(() => {
        logUserIn(req, res, data.user, newUser._id);
    })
    .catch(err => {
        console.log(err);
        res.status(500).send('Account creation failed. Try again later.');
    });
    
}
