import express from 'express';
import * as bcrypt from 'bcrypt';
import {User} from './mongo/user.js'

async function verifyLogin(username: string, password: string): Promise<boolean> {
    const row = await User.findOne({name: username}).select('pass').exec();

    if (row) {
        const hashedPass = row.pass;

        const match = await bcrypt.compare(password, hashedPass); 

        if (match) {
            return true;
        } else {
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

    if (!user || !pass) {
        res.send(403);
        return;
    }

    const correctPass = await verifyLogin(user, pass);

    if (correctPass === true) {
        req.session.user = user;
        const userInfo = await User.findOne({name: user}).select('_id').exec();
        req.session.mongoId = userInfo!._id.toString();
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

    if (await User.exists({name: user}).exec()) {
        return "User already exists.";
    }

    return '';
}



export async function createAccountHandler(req: express.Request, res: express.Response) {
    console.log(req.body);

    const user: string | undefined = req.body['username'];
    const pass: string | undefined = req.body['password'];

    if (!user || !pass) {
        res.send(403);
        return;
    }

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

    const newUser = new User({
        name: user,
        pass: hashedPass
    });

    newUser.save()
    .then(() => {
        req.session.user = user;
        res.redirect("/home");
    })
    .catch(err => {
        console.log(err);
        res.send('Account creation failed. Try again later.');
    });
    
}
