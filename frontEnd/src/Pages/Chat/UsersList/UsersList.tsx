/* eslint-disable @typescript-eslint/no-explicit-any */
import { Socket } from "socket.io-client";
import { getCookieValue } from "../../../utils";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import User from "./User";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import './UsersList.css';

interface UsersListProps {
    socket: Socket;
}

interface ChanUser {
    id: number;
    username: string;
    avatarUrl: string;
    isOnline: boolean;
    active: boolean;
}

async function getInvitedUsers(id: number, token: string) {
    const config = {
        method: 'GET',
        maxBodyLength: Infinity,
        url: `${import.meta.env.VITE_BACKEND_URL}/chat/channels/${id}/invites`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
    };
    const value = await axios.request(config)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return ([]);
        });
    return value;
}

const MySwal = withReactContent(Swal);

const InviteUser = async (id: number, token: string) => {
    const listUsers = await getInvitedUsers(id, token);
    const selection = await MySwal.fire({
        title: 'Invite Users',
        input: 'select',
        inputOptions: listUsers,
        inputPlaceholder: 'Select a user to invite',
        showCancelButton: true,
    });
    if (selection.isConfirmed && selection.value !== undefined && selection.isDismissed === false && selection.value !== '' && selection.value !== null)
        return {confirm: selection.isConfirmed, value: listUsers[parseInt(selection.value)]};
    else
        return {confirm: selection.isConfirmed, value: null};
}

async function getAllUsers(id: number, token: string) {
    const config = {
        method: 'GET',
        maxBodyLength: Infinity,
        url: `${import.meta.env.VITE_BACKEND_URL}/chat/channels/users/${id}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
    };
    const value = await axios.request(config)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return ([]);
        });
    return value;
}

function List({name, users, status, socket}: {name: string, users: ChanUser[], status: boolean, socket: Socket}) {
    return (
        <div className="ListStyle">
            <h2>{name}</h2>
            <div className="List">
                {users.map((item: ChanUser) => {
                    return (
                        <User
                            status={status}
                            category={name}
                            name={item.username}
                            key={item.id}
                            isOnline={item.isOnline}
                            socket={socket}
                        />
                    )
                })}
            </div>
        </div>
    )
}

const UsersList: React.FC<UsersListProps> = ({socket}) => {
    const [token, setToken] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [Members, setMembers] = useState<ChanUser[]>([]);
    const [Muted, setMuted] = useState<ChanUser[]>([]);
    const [Banned, setBanned] = useState<ChanUser[]>([]);
    const [Admins, setAdmins] = useState<ChanUser[]>([]);
    const [isDM, setIsDM] = useState<boolean>(false);
    const [status, setStatus] = useState<boolean>(false);
    const [chanId, setChanId] = useState<number>(0);

    const location = useLocation();


    useEffect(() =>  {
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

    useEffect(() => {
        if (username !== '' && socket.connected) {
            socket.on('NewUserJoin', (value: any) => {
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data;
                    }
                    return [...data, value];
                });
            })

            socket.on('User Banned', (value: any) => {
                let bannedUser: any = undefined;
                setAdmins((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            bannedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            bannedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                setMuted((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            bannedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                if (bannedUser === undefined)
                    return;
                setBanned((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data;
                    }
                    return [...data, {username: bannedUser.username, avatarUrl: bannedUser.avatarUrl, id: bannedUser.id, status: bannedUser.status, active: bannedUser.active}];
                });
            });

            socket.on('User Unbanned', (value: any) => {
                let unbannedUser: any = undefined;
                setBanned((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            unbannedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                if (unbannedUser === undefined)
                    return;
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data;
                    }
                    return [...data, {username: unbannedUser.username, avatarUrl: unbannedUser.avatarUrl, id: unbannedUser.id, status: unbannedUser.status, active: unbannedUser.active}];
                });
            });

            socket.on('User Kicked', (value: any) => {
                setAdmins((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data.filter((user: any) => user.username !== value.username);
                    }
                    return data;
                });
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data.filter((user: any) => user.username !== value.username);
                    }
                    return data;
                });
                setMuted((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data.filter((user: any) => user.username !== value.username);
                    }
                    return data;
                });
            });

            socket.on('User Muted', (value: any) => {
                let mutedUser: any = undefined;
                setAdmins((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            mutedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            mutedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                if (mutedUser === undefined)
                    return;
                setMuted((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data;
                    }
                    return [...data, {username: mutedUser.username, avatarUrl: mutedUser.avatarUrl, id: mutedUser.id, status: mutedUser.status, active: mutedUser.active}];
                });
            });

            socket.on('User Unmuted', (value: any) => {
                let unmutedUser: any = undefined;
                setMuted((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            unmutedUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                if (unmutedUser === undefined)
                    return;
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data;
                    }
                    return [...data, {username: unmutedUser.username, avatarUrl: unmutedUser.avatarUrl, id: unmutedUser.id, status: unmutedUser.status, active: unmutedUser.active}];
                });
            });

            socket.on('User Set Admin', (value: any) => {
                let adminUser: any = undefined;
                setMembers((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username) {
                            adminUser = data[i];
                            return data.filter((user: any) => user.username !== value.username);
                        }
                    }
                    return data;
                });
                if (adminUser === undefined)
                    return;
                setAdmins((data:any) => {
                    for (const i in data) {
                        if (data[i].username === value.username)
                            return data;
                    }
                    return [...data, {username: adminUser.username, avatarUrl: adminUser.avatarUrl, id: adminUser.id, status: adminUser.status, active: adminUser.active}];
                });
            });

            socket.on('User Left', (value: any) => {
                setAdmins((data:any) => data.filter((user: any) => user.username !== value.username));
                setMembers((data:any) => data.filter((user: any) => user.username !== value.username));
                setMuted((data:any) => data.filter((user: any) => user.username !== value.username));
            });
        }
        return () => {
            socket.off('NewUserJoin');
            socket.off('User Banned');
            socket.off('User Unbanned');
            socket.off('User Kicked');
            socket.off('User Muted');
            socket.off('User Unmuted');
            socket.off('User Set Admin');
            socket.off('User Left');
        }
    }, [username, socket]);

    useEffect(() => {
        if (location.pathname != '/Chat' && token !== '') {
            const id = Number(location.pathname.split('/')[2]);
            getAllUsers(id, token).then((data) => {
                if (data.status === 'none')
                    return;
                else if (data.status === 'admin' && !data.isDM)
                    setStatus(true);
                else
                    setStatus(false);

                if (data.isDM)
                    setIsDM(true);
                else
                    setIsDM(false);
                setAdmins(data.admins);
                setMembers(data.members);
                setMuted(data.muted);
                setBanned(data.banned);
        })
    }
    }, [location.pathname, token, socket]);

    return (
        <>
        <div className="UserListStyle">
            <List name="Admins" users={Admins} status={status} socket={socket}/>
            { isDM ? null : <List name="Members" users={Members} status={status} socket={socket}/> }
            { isDM ? null : <List name="Muted" users={Muted} status={status} socket={socket}/> }
            { isDM ? null : <List name="Banned" users={Banned} status={status} socket={socket}/> }
        </div>
        <hr className="saberHr"></hr>
        <div className="UserButtonsStyle">
        {status && !isDM ?
            <button onClick={() => {
                InviteUser(chanId, token).then((value) => {
                    if (value.confirm)
                        socket.emit('Invite User', {username: value.value, chanId: chanId});
                });
            }}>Invite</button> :
        null}
        
        {isDM ?
            null :
            <button onClick={() => {
                socket.emit('Leave Channel', {chanId: chanId});
            }}>Leave Chanel</button>
            }
        
        {isDM ?
            <button onClick={() => {
                socket.emit('play', {chanId: chanId})
            }}>Play a Pong Game</button> :
            null}
        </div>
    </>  
    );
}

export default UsersList;