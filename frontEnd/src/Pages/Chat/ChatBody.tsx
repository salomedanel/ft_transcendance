import React, { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ChannelList from './ChannelList/ChannelList';
import ChatMain from './ChatMain/ChatMain';
import UsersList from './UsersList/UsersList';

type ChatBodyProps = {
  socket: Socket;
  isSocketConnected: boolean;
};

const mySwal = withReactContent(Swal);

const ChatBody: React.FC<ChatBodyProps> = ({ socket, isSocketConnected }) => {
    useEffect(() => {
        socket.on("error", (error: string) => {
            mySwal.fire({
                title: 'Error',
                text: error,
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
        return () => {
            socket.off("error");
        }
    }, [socket]);

  return (
    <div className='ChatBodyStyle'>
      { isSocketConnected?
        <div>
            <ChannelList socket={socket} />
            {location.pathname === '/Chat' ? null :
              <>
              <ChatMain socket={socket} />
              <UsersList socket={socket} />
              </>}
        </div> :
        <div>
            <h1>Chat</h1>
            <p>Socket not connected</p>
        </div>}
    </div>
  );
};

export default ChatBody;
