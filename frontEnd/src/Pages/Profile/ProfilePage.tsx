import { getCookieValue } from '../../utils';
import LogoutButton from './components/LogoutButton';
import ProfileDetails from './components/ProfileDetails';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export interface UserProfile {
  username: string;
  friends: { id: string; name: string; profilePicture: string}[];
  matches: {player1: string; score: string; player2: string}[];
}

export const ProfilePage = () => {
	const [token, setToken] = useState<string>('');
	const navigate = useNavigate();


	useEffect(() => {
		const cookieToken = getCookieValue('token');
		if (!cookieToken)
		  navigate('/');
		else
		  setToken(cookieToken);
	  }, [token]);


  return (
    <div>
      <ProfileDetails />
      <LogoutButton/>
    </div>
  );
};

export default ProfilePage;