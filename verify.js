module.exports = {
    validUserPass(user, pass) {
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
    
        if (pass.length > 72) {
            return "Password too long (max = 72 characters).";
            
        }
    }
}
