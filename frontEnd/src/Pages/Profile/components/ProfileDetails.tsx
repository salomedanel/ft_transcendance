import { useNavigate, useParams } from 'react-router-dom';
import defaultAvatar from '../../../assets/default.jpg';
import '../style/ProfileDetails.css';
import { useEffect, useState } from 'react';
import { getCookieValue } from '../../../utils';
import AchievementList from './AchievementList';

interface Friend {
  username: string;
  status: string;
  avatar: string;
}

interface GameHistory {
  date: string;
  player: string,
  player1: string,
  player2: string,
  score: [number, number],
  winner: string,
}


const ProfileDetails = () => {
  const [token, setToken] = useState<string>('');
  const [_exist, setExist] = useState<boolean>(false);
  const [myself, setMyself] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token !== '' && username)
    {
      whoIsUser(username, token);
      getUserId(username);
      getAvatar(username);
    }
    const cookieToken = getCookieValue('token');
    if (cookieToken)
      setToken(cookieToken);
  }, [token, username]);

  useEffect(() => {
    if (userId) {
      getFriendStatus(userId);
      getBlockedStatus(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (token !== '' && username) {
      getFriends(username);
      getGameHistory(username);
    }
  }, [token, username, isFriend]);

  async function whoIsUser(username: string, token: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/username/validation`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Username': username,
            'Authorization': token
        },
      });
      const data = await response.json();
      if (data.value === true) {
          setExist(true);
          setMyself(data.loggedUser);
      } else {
          setExist(false);
          navigate('/');
      }
    } catch (error) {
        console.log(error);
    }
  }

  async function getUserId(username: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/username/id`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Username': username
        },
      });
      const data = await response.json();
      if (data)
        setUserId(data.id);
    } catch (error) {
        console.log(error);
    }
  }

  async function getAvatar(username: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
      });
      if (response.status === 400)
        return;
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      setAvatar(file);
    } catch(error) {
      console.log(error);
      return;
    }
  }

  async function getFriendStatus(userId: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/friends/status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            'Id': userId
        },
      });
      const data = await response.json();
      if (data.value)
        setIsFriend(true);
      else
        setIsFriend(false);
    } catch (error) {
        console.log(error);
    }
  }

  async function getBlockedStatus(userId: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/blocked/status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            'Id': userId
        },
      });
      const data = await response.json();
      if (data.value)
        setIsBlocked(true);
      else
        setIsBlocked(false);
    } catch (error) {
        console.log(error);
    }
  }

  async function addFriend() {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/friends/add`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, token: token }),
      });
      const data = await response.json();
      if (data.value)
        setIsFriend(true);
    } catch (error) {
        console.log(error);
    }
  }

  async function removeFriend() {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/friends/remove`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, token: token }),
      });
      const data = await response.json();
      if (data.value)
        setIsFriend(false);
    } catch (error) {
        console.log(error);
    }
  }

  async function blockUser() {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/user/block`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, token: token }),
      });
      const data = await response.json();
      if (data.value)
        setIsBlocked(true);
    } catch (error) {
        console.log(error);
    }
  }

  async function unblockUser() {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/user/unblock`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, token: token }),
      });
      const data = await response.json();
      if (data.value)
        setIsBlocked(false);
    } catch (error) {
        console.log(error);
    }
  }

  async function getFriends(username: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/username/friends`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Username': username
        },
      });
      const data = await response.json();
      setFriends(data);
    } catch (error) {
        console.log(error);
    }
  }

  async function getGameHistory(username: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/history`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Username': username
        },
      });
      const data = await response.json();
	  const sortedGameHistory = data.slice().sort((a: GameHistory, b: GameHistory) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setGameHistory(sortedGameHistory);
    } catch (error) {
        console.log(error);
    }
  }

  return (
    <>
    <div className='profile-details-container'>
        <img src={avatar ? URL.createObjectURL(avatar) : defaultAvatar} alt="avatar" className='avatar'/>
      <div className='profile-info'>
        <h2>@{username}</h2>
      </div>
    </div>
    <div className='profileButton'>
    { myself ? (
        <button className='btn' onClick={() => navigate('/Settings')}>Edit Profile</button>
      ) : (
        <>
        { !isFriend ? (
          <button className='btn' onClick={addFriend}>Add Friend</button>
        ) : (
          <button className='btn' onClick={removeFriend}>Remove Friend</button>
        )}
        { !isBlocked ? (
          <button className='btn' onClick={blockUser}>Block User</button>
        ) : (
          <button className='btn' onClick={unblockUser}>Unblock User</button>
        )}
        </>
      )
    }
    </div>
    <h2>Friends</h2>
    <ul className="friend-list">
      {friends.map((friend) => (
        <li key={friend.username} className="friend-item" onClick={() => {
			navigate(`/Profile/${friend.username}`);
		}}>
          <img src={friend.avatar} alt={`Avatar of ${friend.username}`} className="avatarFriends" />
          <div className="friend-details">
            <span className="friend-name">{friend.username}</span>
            <div className={`status-indicator ${friend.status.toLowerCase()}`}></div>
          </div>
        </li>
      ))}
    </ul>
    <h2>Game History</h2>
    <div className="game-history-table-container">
    <table className="game-history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Player 1</th>
          <th>Score 1</th>
          <th>Score 2</th>
          <th>Player 2</th>
          <th>Winner</th>
        </tr>
      </thead>
      <tbody>
	  {gameHistory
		.map((game, index) => {
			const isPlayer1Winner = game.winner === game.player1;

			return (
			<tr key={index}>
			<td>{new Date(game.date).toLocaleString()}</td>
			<td>{isPlayer1Winner ? game.player1 : game.player2}</td>
			<td>{Math.max(game.score[0], game.score[1])}</td>
			<td>{Math.min(game.score[0], game.score[1])}</td>
			<td>{isPlayer1Winner ? game.player2 : game.player1}</td>
			<td className="winner">{game.winner}</td>
			</tr>
			);
		})}
      </tbody>
    </table>
    </div>
    <AchievementList friends={friends} gameHistory={gameHistory} username={username} />
    </>
  );
};

export default ProfileDetails;
