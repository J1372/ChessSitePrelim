import React, { useState } from 'react'
import { Link } from 'react-router-dom';

function Login() {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [err, setErr] = useState('');
    const [state, setState] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        setState('submitting');

        fetch('/users/login', {
            method: 'post',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },

            body: new URLSearchParams({
                'user':user,
                'pass':pass
            })
        })
        .then(async res => {
            if (res.ok) {
                window.location.href = '/home';
            } else {
                setErr(await res.text());
                setState('');
            }
        })
        .catch(_ => {
            setErr('Try again later.')
            setState('');
        });
    }

    return (
        <div>
            <form className='common-form' action='/users/login' method='post'>
                {err.length !== 0 && 
                <>
                    <p className='error-msg'>{err}</p>
                </>
                }

                <ul className='args'>
                    <li>
                        <label htmlFor="usernameInput">Username:</label>
                        <input id='usernameInput' type='text' name='user' value={user} onChange={e => setUser(e.target.value)} maxLength={16} autoComplete='username' required></input>
                    </li>
                    <li>
                        <label htmlFor="passwordInput">Password:</label>
                        <input id='passwordInput' type='text' name='pass' value={pass} onChange={e => setPass(e.target.value)} autoComplete='current-password' required></input>
                    </li>
                </ul>
                <button className='button' type='submit' onClick={handleSubmit} disabled={user.length === 0 || pass.length === 0 || state === 'submitting'}>Login</button>
            </form>
            <p className='common-form'>
                Or <Link className="button" to="/create-account">Register</Link> instead
            </p>
        </div>
    );
}

export default Login;