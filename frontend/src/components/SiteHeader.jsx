import { useContext } from 'react'
import { Link } from 'react-router-dom';
import { SessionUserContext } from '../contexts/SessionUserContext';

export function SiteHeader() {
    const sessionUser = useContext(SessionUserContext);

    function logout() {
      fetch('/users/logout', { method: 'post' })
      .then(_ => {
        window.location.reload();
      });
    };

    return (
      <>
        <h1 id="site-title">Chess Website</h1>
        <nav id='site-nav' className='section'>
            <Link to='/home' className='button'>Home</Link>
            {sessionUser !== '' 
            ?
            <>
              <Link to={'/users/' + sessionUser} className='button'>{sessionUser}</Link>
              <button onClick={logout} className='button'>Logout</button>
            </>
            :
            <Link to='/login' className='button'>Login / Sign-up</Link>
            }
        </nav>
      </>
    )
}
