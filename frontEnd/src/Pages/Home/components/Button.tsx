import React, { ReactNode, MouseEvent } from 'react';
import '../style/Button.css'

interface ButtonProps {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}

interface LoggedProps {
  isLoggedIn: boolean;
}

const CustomButton: React.FC<ButtonProps & LoggedProps> = ({ onClick, children , isLoggedIn}: ButtonProps & LoggedProps) => {
  // isLoggedIn = true;
  if(!isLoggedIn)
    return null ;
  return (
    <button onClick={onClick} className='button-home'>{children}</button>);
};

export default CustomButton;
