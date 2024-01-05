import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getCookieValue } from "../../../utils";

type ChatMainProps = {
    socket: Socket;
  };

const FormAdmin: React.FC<ChatMainProps> = ({ socket }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        if(token !== '')
            getUsername(token);
        const cookieToken = getCookieValue('token');
        if (cookieToken)
            setToken(cookieToken);
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

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const id = Number(location.pathname.split('/')[2]);
        socket.emit('Update Channel', {chanId: id, password: password, username: username});
        setIsOpen(false);
    }

    return (
        <div>
            <button className="btn" onClick={() => setIsOpen(true)}>Update Channel</button>
            {isOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setIsOpen(false)}>&times;</span>
                        <form onSubmit={handleSubmit} className="channel-form">
                            <label className="form-label" htmlFor="password">Edit Password:</label>
                            <input className="form-input" type="password" name="password" placeholder="password" id="password" value={password} onChange={handleChange} maxLength={15}/>
                            <input className="form-submit" type="submit" value="Update" />
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FormAdmin;