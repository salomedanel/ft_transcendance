import { io } from "socket.io-client";
import { getCookieValue } from "../../utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ChatBody from "./ChatBody";


export const Chat = () => {
    const [socket,_setSocket]= useState(io(`${import.meta.env.VITE_BACKEND_URL}/chat`, { transports: ['websocket'], autoConnect: false, reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 3 }));
    const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
	const [token, setToken] = useState<string>('');
	const navigate = useNavigate();


	useEffect(() => {
		const cookieToken = getCookieValue('token');
		if (!cookieToken)
		  navigate('/');
		else
		  setToken(cookieToken);
	  }, [token]);

    useEffect(() => {
        if (socket.disconnected) {
            socket.auth={token: getCookieValue('token')};
            socket.connect();
            setIsSocketConnected(true);
        }
        return () => {
            if (socket.connected) {
                socket.disconnect();
            }    
        }
    }, [socket]);
    
    return (
        <ChatBody socket={socket} isSocketConnected={isSocketConnected} />
    );
};