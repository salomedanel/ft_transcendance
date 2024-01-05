import Header from './Header';
import CustomButton from './Button';
import { BiPlay , BiSolidChat} from "react-icons/bi";
import { useNavigate } from 'react-router-dom';

export const Home = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
    const navigate = useNavigate();
      return (
          <div className='p-homepage'>
            <Header/>
            <CustomButton isLoggedIn={isLoggedIn} onClick={() => navigate('/PongGame')}><BiPlay/>PLAY</CustomButton>
            <p></p>
            <CustomButton isLoggedIn={isLoggedIn} onClick={() => navigate('/Chat')}><BiSolidChat/>CHAT</CustomButton>
          </div>
      )
};

export default Home;