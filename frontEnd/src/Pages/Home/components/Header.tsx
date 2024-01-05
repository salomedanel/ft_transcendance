import '../style/Header.css'
import logo from '../style/pong.png'
import styled, {keyframes} from 'styled-components';

const neonAnimation = keyframes`
  0% {
    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #C101A4, 0 0 40px #C101A4, 0 0 70px #C101A4, 0 0 80px #C101A4, 0 0 100px #C101A4;
  }
  50% {
    text-shadow: none;
  }
  100% {
    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #C101A4, 0 0 40px #C101A4, 0 0 70px #C101A4, 0 0 80px #e60073, 0 0 100px #C101A4;
  }
`;

const NeonText = styled.div`
  padding: 20px;
  text-transform: uppercase;
  font-family: 'Lexend', sans-serif;
  font-size: 3em;
  color: #fff;
  animation: ${neonAnimation} 3s ease-in infinite;
`;

export const Header = () => {
  const title:string = "Welcome to Pong game !";
  return (
    <header className='header_style'>
      <img src={logo} alt="Pong Game" className='header-img'/>
      <NeonText>{title}</NeonText>
    </header>
  );
};

export default Header;

