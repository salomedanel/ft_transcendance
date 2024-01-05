import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Socket, io } from "socket.io-client";
import { getCookieValue } from '../../../utils';
import axios from 'axios';
import withReactContent from 'sweetalert2-react-content';
import { SketchPicker } from 'react-color';
import Swal from 'sweetalert2';
import Pong from './Pong';
import '../style/PongGame.css';
import 'sweetalert2/dist/sweetalert2.css';

const MySwal = withReactContent(Swal);

interface TableProps {
  data: {
    player1: string,
    player2: string,
    name: string,
    player1Score: number,
    player2Score: number,
    game: any,
  }[];
}

const PongTable = (props: TableProps) => {
  const { data } = props;
  const navigate = useNavigate();

  return (
    <div className='PongTable'>
      <table>
        <thead>
          <tr>
            <th colSpan={6} className='mainTitle'>Live Matches</th>
          </tr>
          <tr className='otherTab'>
            <th>#</th>
            <th className='cellPlayer'>Player1</th>
            <th></th>
            <th className='cellPlayer'>Player2</th>
            <th>Score</th>
            <th>Join</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr className='lineTab' key={index}>
              <td>{index + 1}</td>
              <td className='cellPlayer'>{item.player1}</td>
              <td>vs</td>
              <td className='cellPlayer'>{item.player2}</td>
              <td>{item.player1Score} - {item.player2Score}</td>
              <td className ='JoinStyle' onClick={() => navigate(`${item.name}`)}>Join</td>
            </tr>
          ))}
          {Array(data.length).fill('').map((_item, index) => (
            <tr className='lineTab' key={index + data.length}>
              <td>{index + data.length + 1}</td>
              <td className='cellPlayer'>-</td>
              <td>vs</td>
              <td className='cellPlayer'>-</td>
              <td>-</td>
              <td>x</td>
            </tr>
          )
          )}
        </tbody>
      </table>
    </div>
  );
}

async function getRooms() {
  const config = {
    method: 'GET',
    headers: {},
    maxBodyLength: Infinity,
    url: `${import.meta.env.VITE_BACKEND_URL}/game/rooms`,
  };

  const value = axios.request(config).then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return [];
  });

  return value;
  }

  const playPopUp = (socket: Socket) => MySwal.fire({
    title: 'Searching for a match...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    showCancelButton: true,
    timer: 50000,
    timerProgressBar: true,
	customClass: {
		title: 'my-title-class',
		popup: 'my-popup-class',
		cancelButton: 'my-cancel-button-class',
	  },
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.timer) {
      socket.emit('cancelMatchmaking');
      NoOpPopUp();
    }
    else if (result.dismiss === Swal.DismissReason.cancel) {
      socket.emit('cancelMatchmaking');
    }
  });

  const NoOpPopUp = () => MySwal.fire({
    title: 'No opponent found',
    text: 'Nobody is playing right now, try again later',
  });

const PongGame = () => {
    const [socket, _setSocket] = useState(io(`${import.meta.env.VITE_GAME_URL}/game`
      , {transports: ['websocket'], autoConnect: false, reconnection: true, reconnectionAttempts: 3, reconnectionDelay: 1000 }));
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState<string>('');
    const [data, setData] = useState<any[]>([]);
    const [color, setColor] = useState<[string, string]>(['#C101A4', '#1a1a1a']);
    const [showBallColorPicker, setShowBallColorPicker] = useState(false);
    const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

    const handleColorChange = (newColor: { hex: string; }) => {
      setColor((prevColor) => [newColor.hex, prevColor[1]]);
    };

    const handleBackgroundChange = (newColor: { hex: string; }) => {
      setColor((prevColor) => [prevColor[0], newColor.hex]);
    }

    useEffect(() => {
      const cookieToken = getCookieValue('token');
      if (!cookieToken)
        navigate('/');
      else
        setToken(cookieToken);
      getRooms().then((res) => {
        const rooms = Object.values(res);
        setData(rooms);
      })
    }, [navigate, token]);

    useEffect(() => {
      if (socket.disconnected && token !== '') {
        socket.auth = { token };
        socket.connect();
      }
    }, [socket, token]);

    useEffect(() => {
      socket.on('RoomCreated', (value: any) => {
        setData((rooms: any) => {
          for (const room in rooms) {
            if (rooms[room].name === value.name)
              return (rooms);
          }
        return ([...rooms, value]);
          });
        });

        socket.on("matchFound", (value) => {
          Swal.close();
          navigate(value);
        });
      
      socket.on('RoomDeleted', (value: string) => {
        setData((rooms: any) => {
          return (rooms.filter((room: any) => room.name !== value));
        });
      });

      return (() => {
        socket.off('RoomCreated');
        socket.off('matchFound');
        socket.off('RoomDeleted');
        
        socket.disconnect();
      })
    }, [socket, token, navigate]);
  return (
    <>
    {location.pathname === '/PongGame' ?
        <div className='PongGamePage'>
          <PongTable data={data} />
          <div className='btn' onClick={() => {
            socket.emit('matchmaking');
            playPopUp(socket); }}>Play
          </div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <div className='btn' onClick={() => setShowBallColorPicker(!showBallColorPicker)}>Ball and Paddle Color</div>
          {showBallColorPicker && (
            <div className="color-picker-popup">
				<span onClick={() => setShowBallColorPicker(false)} className="close-button">
				&#10006;
				</span>
              <SketchPicker className="color-picker" color={color[0]} onChange={handleColorChange} />
            </div>
          )}
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <div className='btn' onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}>Background Color</div>
          {showBackgroundPicker && (
			<div className="color-picker-popup">
				<span onClick={() => setShowBackgroundPicker(false)} className="close-button">
				&#10006;
				</span>
				<SketchPicker className="color-picker" color={color[1]} onChange={handleBackgroundChange} />
			</div>
		)}
        </div>
     : <Pong socket={socket} color={color}/>}
    </>
  );
};

export default PongGame;
