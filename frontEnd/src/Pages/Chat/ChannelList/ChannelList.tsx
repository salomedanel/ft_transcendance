/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getCookieValue } from '../../../utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import CreateChannelForm from './CreateChannelForm';
import Channel from './Channel';
import './ChannelList.css';

const MySwal = withReactContent(Swal);

type ChannelListProps = {
  socket: Socket;
};

interface Channel {
    id: number;
    name: string;
    active: boolean;
    isOnline: boolean;
}


const ChannelList: React.FC<ChannelListProps> = ({ socket }) => {
  const [token, setToken] = useState<string>('');
  const [directMessages, setDirectMessages] = useState<Channel[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsToJoin, setChannelsToJoin] = useState<Channel[]>([]);

  const navigate = useNavigate();

  async function getAllChannels(token: string) {
    const config = {
        method: 'GET',
        maxBodyLength: Infinity,
        url: `${import.meta.env.VITE_BACKEND_URL}/chat/channels`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
    };
    const value = axios.request(config)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return ([]);
        });
    return value;
}

async function getNewDMUsers(token: string) {
    const config = {
        method: 'GET',
        maxBodyLength: Infinity,
        url: `${import.meta.env.VITE_BACKEND_URL}/chat/Dm/users`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
    };

    const value = axios.request(config)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return ([]);
        });
    return value;
}

const createDM = async (token: string) => {
    const listUsers = await getNewDMUsers(token);
    const selection = await MySwal.fire({
        title: 'New DM',
        input: 'select',
        inputOptions: listUsers,
        inputPlaceholder: 'Select a user',
        showCancelButton: true,
    })
    if (selection.isConfirmed && selection.value !== undefined && selection.isDismissed === false && selection.value !== '' && selection.value !== null) {
        return { confirm: true, value: listUsers[parseInt(selection.value)] };
    } else {
        return { confirm: false, value: null };
    }
}

  useEffect(() => {
    const cookieToken = getCookieValue('token');
    if (cookieToken)
        setToken(cookieToken);
    }, [token]);

    useEffect(() => {
        socket.on('DM Created', (value: any) => {
            setDirectMessages(data => {
                const existingDM = data.find(dm => dm.id === value.id);
                if (existingDM) {
                    return data;
                }
                return [...data, value];
            });
            navigate(`/Chat/${value.id}`);
        });

        socket.on('Channel Created', (value: any) => {
            if (value.clientId === socket.id) {
                setChannels(data => {
                    for (const i in data) {
                        if (data[i].id === value.id)
                            return data;
                    }
                    return ([...data, value]);
                });
            }
            else {
                setChannelsToJoin(data => {
                    for (const i in data) {
                        if (data[i].id === value.id)
                            return data;
                    }
                    return ([...data, value]);
                });
            }
        });

        socket.on('Joined', (value: any) => {
            let channel: any = undefined;
            setChannelsToJoin(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId) {
                        channel = data[i];
                        return data.filter((channel: Channel) => channel.id !== value.chanId);
                    }
                }
                return data
                });
            if (channel === undefined) {
                navigate(`/Chat/${value.chanId}`);
                return;
            }
            setChannels(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId)
                        return data;
                }
                return ([...data, {name: channel.name, id: channel.id, active: false, isOnline: false}]);
            });
            navigate(`/Chat/${value.chanId}`);
        });

        socket.on('Kicked', (value: any) => {
            let channel: any = undefined;
            setChannels(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId) {
                        channel = data[i];
                        return data.filter((channel: Channel) => channel.id !== value.chanId);
                    }
                }
                return data
                });
            if (channel === undefined)
                return;
            setChannelsToJoin(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId)
                        return data;
                }
                return ([...data, {name: channel.name, id: channel.id, active: false, isOnline: false}]);
            });
        });

        socket.on('Banned', (value: any) => {
            setChannels(data => data.filter((channel: Channel) => channel.id !== value.chanId));
            setChannelsToJoin(data => data.filter((channel: Channel) => channel.id !== value.chanId));
        });

        socket.on('Quit Channel', (value: any) => {
            let quitedChannel: any = undefined;
            setChannels(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId) {
                        quitedChannel = data[i];
                        return data.filter((channel: Channel) => channel.id !== value.chanId);
                    }
                }
                return data;
            });
            if (quitedChannel === undefined)
                return;
            setChannelsToJoin(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId)
                        return data;
                }
                return ([...data, {name: quitedChannel.name, id: quitedChannel.id, active: false, isOnline: false}]);
            });
        });

        socket.on('Invited', (value: any) => {
            setChannelsToJoin(data => {
                for (const i in data) {
                    if (data[i].id === value.chanId)
                        return data;
                }
                return ([...data, {name: value.channelName, id: value.chanId, active: false, isOnline: false}]);
            });
        });

        return () => {
            socket.off('DM Created');
            socket.off('Channel Created');
            socket.off('Joined');
            socket.off('Kicked');
            socket.off('Banned');
            socket.off('Quit Channel');
            socket.off('Invited');
        };
    }, [navigate, socket]);

    useEffect(() => {
        if (token !== '') {
            getAllChannels(token).then((data) => {
                setDirectMessages(data.myDMS);
                setChannels(data.mychannels);
                setChannelsToJoin(data.channelsToJoin);
            });
        }
    }, [token, socket]);

  return (
    <div className='chatListStyle'>
        <h2>Channels</h2>
        <button className='btn'
        onClick={() => {
            createDM(token).then((values) => {
                if (values.confirm && values.value !== null) {
                    socket.emit('Create Direct Message', {username: values.value});
                }
                })
            }}>
                <span>Private Message</span>
        </button>
        <CreateChannelForm socket={socket} />
        <div className="ChannelListsContainer">
            <div>
                <h3 className="ChannelListTitle">Direct Message</h3>
                {directMessages.map((channel: Channel) => {
                    return (
                        <Channel key={`${channel.id}DM`} name={channel.name} active={channel.active ? 'active' : ''} idChan={channel.id} socket={socket}/>
                    );
                })}
            </div>
            <div>
            <h3 className="ChannelListTitle">Joined Channel</h3>
                {channels.map((channel: Channel) => {
                    return (
                        <Channel key={`${channel.id}Channel`} name={channel.name} active={channel.active ? 'active' : ''} idChan={channel.id} socket={socket}/>
                    );
                })}
            </div>
            <div>
            <h3 className="ChannelListTitle">Channel You Can Join</h3>
                {channelsToJoin.map((channel: Channel) => {
                    return (
                        <Channel key={`${channel.id}Join`} name={channel.name} active={channel.active ? 'active' : ''} idChan={channel.id} socket={socket}/>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default ChannelList;
