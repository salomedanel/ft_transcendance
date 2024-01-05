import { useEffect, useState } from 'react'
import './App.css'
import {Home, Menu, ProfilePage, Chat, Settings, Footer} from './Pages/index'
import {Route, Routes, useNavigate} from 'react-router-dom'
import { getCookieValue } from './utils'
import TwoFactor from './Pages/TwoFactor/TwoFactor'
import PongGame from './Pages/Game/components/PongGame'
import ErrorPage from './Pages/Error/ErrorPage'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      console.log('Checking token...');
      const cookieToken = getCookieValue('token');
      if (!cookieToken) {
        console.log('FALSE');
        setIsLoggedIn(false);
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/42/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${cookieToken}`
        },
      });
      if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
        navigate('/');
        return;
      }
      const data = await response.json();
      if (data.error) {
        console.log('FALSE');
        setIsLoggedIn(false);
      } else {
        console.log('OK');
        setIsLoggedIn(true);
      }
      console.log('Token check complete');
    }

    checkToken();
    checkTwoFactor();
  }, []);

  async function checkTwoFactor() {
    const cookieToken = getCookieValue('token');
    if (!cookieToken)
      return;
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/42/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${cookieToken}`
        },
      });
    const data = await response.json();
    if (data.twoFactorActive && !data.twoFactorVerified) {
      navigate('/TwoFactor');
     }
  }

  useEffect(() => {
    if (token !== '')
      getUsername(token);
    }, [token]);
  
    async function getUsername(token: string) {
      try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/username`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `${token}`
              },
          });
          const data = await response.json();
          if (data)
              setUsername(data.username);
      } catch (error) {
          console.log(error);
      }
  }

  useEffect(() => {
    if (token !== '' && username !== '') {
        const fetchData = async () => {
            getAvatar();
        };
        fetchData();
    }
    const cookieToken = getCookieValue('token');
    if (cookieToken)
        setToken(cookieToken);
  }, [token, username]);

  async function getAvatar() {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Username': `${username}`
        },
    });
    if (response.ok) {
      const blob = await response.blob();
      const newFile = new File([blob], 'profilePicture', { type: 'image/png' });
      setAvatar(newFile);
    }
    else
      setAvatar(null);

    } catch(error) {
      return;
    }
  }

//   useEffect(() => {
//     if (!isLoggedIn) {
//       navigate('/');
//     }
//   }, [isLoggedIn, navigate]);

  return (
      <div className='content-wrapper'>
        <Menu isLoggedIn={isLoggedIn} avatar={avatar} token={token} username={username}/>
        <Routes>
          <Route path='/' element={<Home isLoggedIn={isLoggedIn}/>} />
          <Route path='/Profile/:username' element={<ProfilePage />}/>
          <Route path='/PongGame' element={<PongGame/>}/>
          <Route path='/PongGame/:id' element={<PongGame/>}/>
          <Route path='/Chat' element={<Chat/>}/>
          <Route path='/Chat/:id' element={<Chat/>}/>
          <Route path='/Settings' element={<Settings avatar={avatar} setAvatar={setAvatar} username={username} setUsername={setUsername}/>}/>
          <Route path='/TwoFactor' element={<TwoFactor />}/>
		  <Route path="*" element={<ErrorPage />} />
        </Routes>
        <p></p>
        <Footer/>
      </div>
  )
}

export default App