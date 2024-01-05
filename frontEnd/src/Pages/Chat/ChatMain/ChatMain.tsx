import { useLocation, useNavigate } from "react-router-dom";
import { getCookieValue } from "../../../utils";
import { useEffect, useRef, useState } from "react";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { Socket } from "socket.io-client";
import FormAdmin from "./FormAdmin";
import './ChatMain.css';
import ChatMessage from "./Message";

type OwnerType = {
    username: string;
    avatarUrl: string;
}

type ChatType = {
    id: number;
    userId: number;
    createdAt: number;
    channelId: number;
    message: string;
    owner: OwnerType;
}

const MySwal = withReactContent(Swal);

const AlertLeaveDM = () => MySwal.fire({
    title: 'You Cannot Leave DM',
    icon: 'error',
    confirmButtonText: 'Ok',
    confirmButtonColor: '#ff0000'
});

const AlertLeaveChannel = () => MySwal.fire({
    title: 'You have left this channel',
    icon: 'success',
    confirmButtonText: 'Ok',
    confirmButtonColor: '#ff0000'
});

const AlertNotAllowed = () => MySwal.fire({
    title: 'You are not allowed to join this channel',
    icon: 'error',
    confirmButtonText: 'Ok',
    confirmButtonColor: '#ff0000'
});

const AlertBanned = () => MySwal.fire({
    title: 'You are banned from this channel',
    icon: 'error',
    confirmButtonText: 'Ok',
    confirmButtonColor: '#ff0000'
});

const AlertKicked = () => MySwal.fire({
    title: 'You were kicked from this channel',
    icon: 'error',
    confirmButtonText: 'Ok',
    confirmButtonColor: '#ff0000'
});

async function getAllMessages(id: number, token: string) {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/channels/${id}/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            },
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}

async function getChannelName(id: number, token: string) {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/channels/${id}/name`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            },
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}



type ChatMainProps = {
    socket: Socket;
  };

const ChatMain: React.FC<ChatMainProps> = ({ socket }) => {
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [chat, setChat] = useState<ChatType[]>([]);
    const [channelName, setChannelName] = useState<string>('Channel Name');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        const cookieToken = getCookieValue('token');
        if (cookieToken)
            setToken(cookieToken);
        }, [token]);
    
    useEffect(() => {
        socket.on('Quit Direct Message', () => {
            AlertLeaveDM();
        })

        socket.on('Banned', (value) => {
            const id = Number(location.pathname.split('/')[2]);
            if (id !== value.chanId)
                return;
            AlertBanned();
            navigate('/Chat');
        });

        socket.on('Kicked', (value) => {
            const id = Number(location.pathname.split('/')[2]);
            if (id !== value.chanId)
                return;
            AlertKicked();
            navigate('/Chat');
        });

        socket.on('Quit Channel', (value) => {
            const id = Number(location.pathname.split('/')[2]);
            if (id !== value.chanId)
                return;
            AlertLeaveChannel();
            navigate('/Chat');
        });

        return () => {
            socket.off('Quit Direct Message');
            socket.off('Banned');
            socket.off('Kicked');
            socket.off('Quit Channel');
        }
    }, [socket, location.pathname, navigate]);

    function clearMessage() {
        setMessage('');
    }
        
    useEffect(() => {
        socket.on('NewMessage', (value) => {
            const id = Number(location.pathname.split('/')[2]);
            if (id !== value.channelId)
                return;
            setChat(chats => {
                for (const i in chats) {
                    if (chats[i].id === value.id)
                        return chats;
                }
                return [...chats, value];
            })
            ref.current?.scrollIntoView({ behavior: 'smooth' });
        })

        socket.on('NewParty', (value:string) => {
            navigate(`/PongGame/${value}`);
        })

        return () => {
            socket.off('NewMessage');
        }
    }, [socket, location.pathname, navigate]);

    const onStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    async function getIsAdmin(id: number, token: string) {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/channels/${id}/isAdmin`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
            });
            const data = await response.json();
            if (data)
                setIsAdmin(data);
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (location.pathname !== '/Chat' && token !== '') {
            const id = Number(location.pathname.split('/')[2]);
            if (Number.isNaN(id)) {
                navigate('/Chat');
                return;
            }
            getAllMessages(id, token).then((data) => {
                setChat(data);
                socket.emit('Join Channel', id);
            }).catch((error) => {
                if (error.response.status === 403) {
                    AlertNotAllowed();
                    navigate('/Chat');
                }
            });
            getChannelName(id, token).then((data) => {
                setChannelName(data.name);
            })
            ref.current?.scrollIntoView({ behavior: 'smooth' });
            getIsAdmin(id, token);
        }
    }, [location.pathname, navigate, socket, token]);


    return (<>
        <div className="ChatMainStyle">

            <div className="ChatHeader">
                <div></div>
                <h1>{channelName}</h1>
                {isAdmin ? (
                    <FormAdmin socket={socket} />
                ) : (
                    <div></div>
                )}
            </div>

            <div className="ChatBody">
                {chat.map((value, index) => {
                    return (
                        <div key={`${index}Container`} className="ChatContainer">
                            <div key={`${index}Message`} className="ChatMessage">
                                <div className="ChatMessageHeader">
                                    <span className="chatUsername">{value.owner.username}</span>
                                    <span className="chatDate"> [{new Date(value.createdAt).toLocaleString()}]: </span>
                                    <ChatMessage message= {value.message} />
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={ref}></div>
            </div>

            <div className="ChatMessagesender">
                <input type="text"
                    className="ChatInput"
                    placeholder="Type your message here..."
                    onChange={onStateChange}
                    value={message}
                    onFocus={() => {return false;}}
                    onKeyDown={(e) => { if (e.key === 'Enter') {
                        clearMessage();
                        socket.emit('Send Message', {
                            "chanId": Number(location.pathname.split('/')[2]),
                            "message": message,
                        })
                    }}}
                />
                <button className="ButtonSendChat" onClick={() => {
                    clearMessage();
                    socket.emit('Send Message', {
                        "chanId": Number(location.pathname.split('/')[2]),
                        "message": message,
                    })
                }}>Send</button>
            </div>
        </div>
    </>)
}

export default ChatMain;