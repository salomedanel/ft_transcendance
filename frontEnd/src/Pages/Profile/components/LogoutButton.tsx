import {useState} from 'react';
import { BiLogOut} from "react-icons/bi";
import '../style/LogoutButton.css'

const LogoutButton = () => {
  const [isLoggedIn, setLoggedIn] = useState(true);
  
  const handleLogout = () => {
    setLoggedIn(false);
    window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/42/logout`, "_self");
  };
  return (
    <div>
      {isLoggedIn ? (
        <button onClick={handleLogout}  className='logout-button'><BiLogOut/> Log out</button>
      ) : ( 
        <p> You are logged out</p>
      )}
    </div>
  );
};


export default LogoutButton;