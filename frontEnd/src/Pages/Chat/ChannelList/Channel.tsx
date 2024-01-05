import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getCookieValue } from "../../../utils";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import axios from "axios";
import './ChannelList.css';

const MySwal = withReactContent(Swal);

async function getChannelIsProtected(idChan: number, token: string) {
    const config = {
        method: 'GET',
        maxBodyLength: Infinity,
        url: `${import.meta.env.VITE_BACKEND_URL}/chat/channels/${idChan}/isprotected`,
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

interface ChannelProps {
    name: string;
    active?: string;
    idChan: number;
    socket: Socket;
}

const Channel: React.FC<ChannelProps> = ({ name, active, idChan, socket}) => {
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        const cookieToken = getCookieValue('token');
        if (cookieToken)
            setToken(cookieToken);
        }, [token]);

    const selectChannel = () => {
        alertPassword().then((password) => {
            if (password === undefined)
                socket.emit('Join New Channel', {chanId: idChan})
            else
                socket.emit('Join New Channel', {chanId: idChan, password: password})
        });
    };

    const alertPassword = async () => {
        const isProtected = await getChannelIsProtected(idChan, token);
        if (!isProtected)
            return undefined;
        const { value: password } = await MySwal.fire({
            title: 'Enter your password',
            input: 'password',
            inputLabel: 'Your password',
            inputPlaceholder: 'Enter your password',
        })
        return password;
    }
    return (
        <div onClick={selectChannel}
        >
            <div>
                <p className={`Channel${active ? active : ''}`}>{name}</p>
            </div>
        </div>
    );
}

export default Channel;