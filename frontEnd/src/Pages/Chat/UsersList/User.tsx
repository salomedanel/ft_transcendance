import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { getCookieValue } from "../../../utils";
import './User.css';

interface UserProps {
    status: boolean;
    category: string;
    name: string;
    isOnline: boolean;
    socket: Socket;
}

const User = ({status, category, name, socket}: UserProps) => {
    const [token, setToken] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [chanId, setChanId] = useState<number>(0);
    const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (token !== '') {
            getUsername(token);
            setChanId(parseInt(location.pathname.split('/')[2]));
        }
        const cookieToken = getCookieValue('token');
        if (cookieToken)
            setToken(cookieToken);
    }, [location.pathname, token]);

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

    const handleClick = () => {
        setShowContextMenu(!showContextMenu);
    }

    return (
        <div className="user">
            <div className="iduser" onClick={handleClick}>
                <span className="userName">{name}</span>
            </div>
            {showContextMenu && (
                <div className="contextMenu">
                <button className="admin-btn" onClick={() => navigate (`/Profile/${name}`)}>Profile</button>
                {username !== name && (
                    <>
                    {status && (category === "Members") ?
                        <button className="admin-btn" onClick={() => socket.emit('Set Admin', {username: name, chanId: chanId})}>Give Admin</button> : null}
                    {status && (category === "Members" || category === "Muted") ?
                        <button className="admin-btn" onClick={() => socket.emit('Kick User', {username: name, chanId: chanId})}>Kick</button> : null}
                    {status && (category === "Members" || category === "Muted") ?
                        <button className="admin-btn" onClick={() => socket.emit('Ban User', {username: name, chanId: chanId})}>Ban</button> : null}
                    {status && (category === "Members") ?
                        <button className="admin-btn" onClick={() => socket.emit('Mute User', {username: name, chanId: chanId})}>Mute</button> : null}
                    {status && category === "Muted" ?
                        <button className="admin-btn" onClick={() => socket.emit('Unmute User', {username: name, chanId: chanId})}>Unmute</button> : null}
                    {status && category === "Banned" ?
                        <button className="admin-btn" onClick={() => socket.emit('Unban User', {username: name, chanId: chanId})}>Unban</button> : null}
                    </>
                )}
            </div>
                )}
            
        </div>
    )

    
}

export default User;