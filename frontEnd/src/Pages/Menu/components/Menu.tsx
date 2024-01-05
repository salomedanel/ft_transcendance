import {Link} from 'react-router-dom';
import '../style/Menu.css';
import DropDown from './DropDown';
import { BiGhost, BiHomeAlt, BiSolidChat, BiLogIn} from "react-icons/bi";
import defaultAvatar from '../../../assets/default.jpg';



export const Menu: React.FC<{ avatar: File | null; isLoggedIn: boolean; token: string; username: string}> = ({ avatar, isLoggedIn, username}) => {
    // const [id, setId] = useState<number>(0);

    // useEffect(() => {
    //     if (token !== '')
    //         getId(token);
    // }, [token]);

    // async function getId(token: string) {
    //     try {
    //         const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/id`, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `${token}`
    //             },
    //         });
    //         const data = await response.json();
    //         if (data)
    //             setId(data.id);
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    
    if (!isLoggedIn)
        return (
        <nav className='navbar'>
            <Link to="/" className='left'><BiHomeAlt/> Home</Link>
            <Link to="/" className='right' onClick={() => {
                window.open(`${import.meta.env.VITE_API42_REDIRECTION_URL}`, '_self')}}><BiLogIn/> Login</Link>
        </nav>
        )
        return (
        <>
        <nav className='navbar'>
           <div className='left'>
            <Link to="/"><BiHomeAlt/> Home</Link>
            <Link to="/PongGame"><BiGhost/> Game</Link>
            <Link to={`/Chat`}><BiSolidChat/> Chat</Link>
            </div>
            <div className='right'>
            <Link to={`/Profile/${username}`}>
                <div className='avatar-container'>
                    <img src={avatar ? URL.createObjectURL(avatar) : defaultAvatar} alt="avatar" className='avatar'/>
                </div>
            </Link>
            <Link to={`/Profile/${username}`}>
                Profile
            </Link>
            <div><DropDown/></div>
            </div>
        </nav>
        </>
    );
}