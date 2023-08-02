import { body, query } from "express-validator";
import express from 'express';

export const loginRegBasicSchema = [body('user').notEmpty(), body('pass').notEmpty()];
export const moveSchema = [body('from').isString(), body('to').isString(), body('promotion').optional().isString()];
export const createGameSchema = body('color').isIn(['e', 'w','b']);

export const recentGameQuery = query('max').optional().isInt({min: 0, max: 10});

export function loggedIn(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.session.user) {
        next();
    } else {
        res.sendStatus(403);
    }
}

export function notLoggedIn(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.session.user) {
        res.sendStatus(403);
    } else {
        next();
    }
}
