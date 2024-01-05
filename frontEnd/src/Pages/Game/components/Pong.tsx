import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Socket } from "socket.io-client"
import { getCookieValue } from "../../../utils";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Board from "./Board";

const MySwal = withReactContent(Swal);

const AlertRoomNotFound = () => {
    MySwal.fire({
        title: 'Error!',
        text: 'Room not found',
        icon: 'error',
        confirmButtonText: 'Ok'
    });
}

enum StatusGame {
    Waiting,
    Playing,
    Finished,
}

async function getPlayer(idGame: string, token: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/game/rooms/${idGame}/player`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`,
        }
    });
    const data = await res.json();
    return data;
}

const Pong: React.FC<{ socket: Socket, color: [string, string] }> = ({ socket, color }) => {
    const params = useParams();
    const navigate = useNavigate();
    const [idGame, setIdGame] = useState<string>('');
    const [playerNumber, setPlayerNumber] = useState<number>(0);
    const [won, setWon] = useState<boolean>(false);
    const [gameStatus, setGameStatus] = useState<StatusGame>(StatusGame.Waiting);
    const [score, setScore] = useState<[number, number]>([0, 0]);
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        const cookieToken = getCookieValue('token');
        if (cookieToken && cookieToken !== '') {
            setToken(cookieToken);
        }
    },[token]);

    useEffect(() => {
        if (socket.disconnected && token !== '') {
            socket.auth = { token };
            socket.connect();
        }
    }, [socket, token]);

    useEffect(() => {
        setIdGame(params.id as string);
        if (idGame !== '' && token !== '') {
            getPlayer(idGame, token).then((data: number) => {
                if  (data === 0){
                    AlertRoomNotFound();
                    navigate('/PongGame');
                }
                setPlayerNumber(data);
            });
			if (playerNumber !== 0) {
				console.log({params: params.id, roomName: idGame, token: token, playerNumber: playerNumber, socket: socket});	
            	socket.emit('JoinRoom', { roomName: idGame });
			}
        }

        socket.on('GameStarted', () => {
            setGameStatus(StatusGame.Playing);
        });

        socket.on('playerLeft', (value) => {
            setGameStatus(StatusGame.Finished);
            setScore(value.score);
			console.log(value.score)
            if (playerNumber !== value.player)
                setWon(true);
        });

        socket.on('UpdateScore', (value) => {
            setScore(value.score);
        });

        socket.on('GameEnded', (value) => {
            setGameStatus(StatusGame.Finished);
            setScore(value.score);
            if (playerNumber === value.winner)
                setWon(true);
        });

        return (() => {
            socket.off('GameStarted');
            socket.off('playerLeft');
            socket.off('UpdateScore');
            socket.off('GameEnded');
        });
    }, [params.id, idGame, playerNumber, socket, token]);

    return (
    <div className="PongStyle">
        {gameStatus === StatusGame.Playing ?
            null
        :
            <div className="PongWaiting">
                { gameStatus === StatusGame.Waiting ?
                    <p>Waiting for opponent...</p>
                    :
                    <>
                    <p className="PongWinner">{won ? 'You Won!' : 'You Lost!'}</p>
                    <p className="PongScore">Score: {score[0]} - {score[1]}</p>
                    <button className='btn' onClick={() => {
                        socket.emit('LeaveRoom', { roomName: idGame });
                        socket.disconnect();
                        navigate('/');
                    }}>Go Back</button>
                    </>
                }
            </div>
        }
        <div>
        <p className="PongScore">{score[0]} - {score[1]}</p>
        <button className='btn' onClick={() => {
            Swal.fire(
                'How to play ?',
                'Use your mouse to move and hit the ball. The first player to reach 5 points wins the game.',
                'question'
            )}}>How to play ?</button>
        </div>
        {idGame !== '' && playerNumber !== 0 && socket.connected ?
            <Board playerNumber={playerNumber} socket={socket} idGame={idGame} color={color} />
            :
            <div className="PongLoading">Loading...</div>
        }
    </div>
    );
};

export default Pong;