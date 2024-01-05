import { useState, useRef } from 'react';
import '../style/DropDown.css';
import { BiMenu, BiLogOut, BiSolidEdit} from "react-icons/bi";
import {Link} from 'react-router-dom' 

export const DropDown = () => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const timeoutRef = useRef<number | null>(null);
  
    const handleMouseEnter = () => {
    //  clearTimeout(timeoutRef.current);
      setMenuOpen(true);
    };
  
    const handleMouseLeave = () => {
      timeoutRef.current = window.setTimeout(() => {
        setMenuOpen(false);
      }, 10000);
    };

    const handleMenuIconClick = () => {
      setMenuOpen(!isMenuOpen);
      console.log('Menu icon clicked. isMenuOpen:', !isMenuOpen);
    };

  return (
      <div className="menu-icon" 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        onClick={handleMenuIconClick}>{<BiMenu />}
      {isMenuOpen && (
        <div className="dropdown-menu">
          <Link to="/Settings"><BiSolidEdit/> Edit profile</Link>
          <Link to="/" onClick={() => {
              window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/42/logout`, "_self"); }}><BiLogOut/> Logout</Link>
        </div>
      )}
    </div>
  );
};

export default DropDown;