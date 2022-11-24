
export class SessionInfo {

    user: string;
    lastActivity: number;

    constructor(user:string, lastActivity: number) {
        this.user = user;
        this.lastActivity = lastActivity;
    }
}

export const sessions = new Map<string, SessionInfo>();


export function msToMinutes(ms: number) {
    return (ms / 1000) / 60;
}

export function clearInactiveSessions() {
    console.log(`Scanning inactive sessions at time ${new Date().toLocaleString()}`);

    for (const [id, info] of sessions.entries()) {
        const dif = Date.now() - info.lastActivity;
        if (msToMinutes(dif) >= 1) {
            console.log(`Ending session ${id}, of user: ${info.user}`);
            sessions.delete(id);
        }
    }
}
