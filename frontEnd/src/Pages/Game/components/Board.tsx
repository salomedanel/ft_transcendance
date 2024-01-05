import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import '../style/Board.css';

interface BoardProps {
    playerNumber: number,
    socket: Socket,
    idGame: string,
    color: [string, string],
}

const data = {
    board: {
        width: 0,
        height: 0,
        orientation: -1,
    },
    ball: {
        x: 0,
        y: 0,
        radius: 0,
        speed: 0,
        velocityX: 0,
        velocityY: 0,
    },
    player1: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    },
    player2: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    },
};

function drawBall(canvas: HTMLCanvasElement, color: [string, string]) {
    const context = canvas.getContext('2d');
    if (!context) return;
    context.beginPath();
    context.arc(data.ball.x * canvas.width, data.ball.y * canvas.height, data.ball.radius * canvas.width , 0, Math.PI * 2);
    context.fillStyle = color[0];
    context.fill();
    context.closePath();
}

function drawPlayers(canvas: HTMLCanvasElement, color: [string, string]) {
    const context = canvas.getContext('2d');
    if (!context) return;
    if (data.board.orientation === 0) {
        data.player1.x = 0;
        data.player2.x = 1 - data.player2.width;
        context.fillStyle = color[0];
        context.fillRect(canvas.width - (canvas.width * data.player2.width), data.player1.y * canvas.height, canvas.width * data.player1.width, canvas.height * data.player1.height);
        context.fillRect(0, data.player2.y * canvas.height, canvas.width * data.player2.width, canvas.height * data.player2.height);
    }
    else if (data.board.orientation === 1) {
        data.player1.y = 0;
        data.player2.y = data.player2.height;
        context.fillStyle = color[0];
        context.fillRect((1 - data.player1.x - 0.2) * canvas.width, canvas.height - (canvas.height * data.player2.height), canvas.width * data.player1.width, canvas.height * data.player1.height);
        context.fillRect((1 - data.player2.x - 0.2) * canvas.width, 0, canvas.width * data.player2.width, canvas.height * data.player2.height);
    }
}

const Board: React.FC<BoardProps> = ({ playerNumber, socket, idGame, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size, setSize] = useState({orientation: -1, width: 0, height: 0});



    function updateSize() {
        const width = window.innerWidth * 0.7;
        const height = window.innerHeight * 0.8;

        if (width > height) {
            if (data.board.orientation === 1) {
                [data.player1.x, data.player1.y, data.player2.x, data.player2.y] =
                [data.player1.y, data.player1.x, data.player2.y, data.player2.x];
            }
            data.board.orientation = 0;
            data.player1.width = 0.02;
            data.player1.height = 0.2;
            data.player2.width = 0.02;
            data.player2.height = 0.2;
            if (width * (4/7) < height) {
                setSize({orientation: 0, width: width, height: width * (4/7)});
                data.board.width = width;
                data.board.height = width * (4/7);
            }
            else {
                setSize({orientation: 0, width: height * (7/4), height: height});
                data.board.width = height * (7/4);
                data.board.height = height;
            }
        }
        else {
            if (data.board.orientation === 0) {
                [data.player1.x, data.player1.y, data.player2.x, data.player2.y] =
                [data.player1.y, data.player1.x, data.player2.y, data.player2.x];
            }
            data.board.orientation = 1;
            data.player1.width = 0.2;
            data.player1.height = 0.02;
            data.player2.width = 0.2;
            data.player2.height = 0.02;
            if (height * (4/7) < width) {
                setSize({orientation: 1, width: height * (4/7), height: height});
                data.board.width = height * (4/7);
                data.board.height = height;
            }
            else {
                data.board.width = width;
                data.board.height = width * (7/4);
                setSize({orientation: 1, width: width, height: width * (7/4)});
            }
        }
    }

    useEffect(() => {
        socket.on('UpdatePostion', (value) => {
            if (value.playerRole === 1 && data.board.orientation === 0)
                data.player1.y = value.position;
            else if (value.playerRole === 1 && data.board.orientation === 1)
                data.player1.x = value.position;
            else if (value.playerRole === 2 && data.board.orientation === 0)
                data.player2.y = value.position;
            else if (value.playerRole === 2 && data.board.orientation === 1)
                data.player2.x = value.position;
        });
        
        socket.on('GetBallPosition', (ball) => {
            if (data.board.orientation === 0) {
                data.ball.x = ball.x;
                data.ball.y = ball.y;
            }
            else if (data.board.orientation === 1) {
                data.ball.x = 1 - ball.y;
                data.ball.y = ball.x;
            }
            data.ball.speed = ball.speed;
            data.ball.radius = ball.radius;
        })

        return (() => {
            socket.off('UpdatePostion');
            socket.off('GetBallPosition');
        })
    }, [socket]);

    useEffect(() => {
        updateSize();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const render = () => {
            const context = canvas.getContext('2d');
            if (!context) return;
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawBall(canvas, color);
            drawPlayers(canvas, color);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
        window.addEventListener('resize', updateSize);
        return() => window.removeEventListener('resize', updateSize);
    }, [idGame, socket, size.height, size.width, color])

    return(
        <div style={
            {
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }} className="BoardBackground">
            <div className="Board">
                <canvas id="canvasPong" ref={canvasRef} width={size.width} height={size.height} className="canvasBoard" style={{
          backgroundColor: color[1],
        }} onMouseMove={(event)=> {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    if (size.orientation === 0) {
                        if (playerNumber === 1) {
                            data.player1.y = event.nativeEvent.offsetY / canvas.height;
                            if (data.player1.y < 0)
                                data.player1.y = 0;
                            else if (data.player1.y > 0.8)
                                data.player1.y = 0.8;
                            socket.emit('move', {idGame: idGame, player: 1, position: data.player1.y});
                        }
                        else if (playerNumber === 2) {
                            data.player2.y = event.nativeEvent.offsetY / canvas.height;
                            if (data.player2.y < 0)
                                data.player2.y = 0;
                            else if (data.player2.y > 0.8)
                                data.player2.y = 0.8;
                            socket.emit('move', {idGame: idGame, player: 2, position: data.player2.y});
                        }
                    }
                    else if (size.orientation === 1) {
                        if (playerNumber === 1) {
                            data.player1.x = 1 - (event.nativeEvent.offsetX / canvas.width);
                            if (data.player1.x < 0)
                                data.player1.x = 0;
                            else if (data.player1.x > 0.8)
                                data.player1.x = 0.8;
                            socket.emit('move', {idGame: idGame, player: 1, position: data.player1.x});
                        }
                        else if (playerNumber === 2) {
                            data.player2.x = 1 - (event.nativeEvent.offsetX / canvas.width);
                            if (data.player2.x < 0)
                                data.player2.x = 0;
                            else if (data.player2.x > 0.8)
                                data.player2.x = 0.8;
                            socket.emit('move', {idGame: idGame, player: 2, position: data.player2.x});
                        }
                    }
                    
                }} onMouseLeave={(event) => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    if (size.orientation === 0) {
                        if (playerNumber === 1) {
                            data.player1.y = event.nativeEvent.offsetY / canvas.height;
                            if (data.player1.y < 0)
                                data.player1.y = 0;
                            else if (data.player1.y > 0.8)
                                data.player1.y = 0.8;
                            socket.emit('move', {idGame: idGame, player: 1, position: data.player1.y});
                        }
                        else if (playerNumber === 2) {
                            data.player2.y = event.nativeEvent.offsetY / canvas.height;
                            if (data.player2.y < 0)
                                data.player2.y = 0;
                            else if (data.player2.y > 0.8)
                                data.player2.y = 0.8;
                            socket.emit('move', {idGame: idGame, player: 2, position: data.player2.y});
                        }
                    }
                    else if (size.orientation === 1) {
                        if (playerNumber === 1) {
                            data.player1.x = 1 - (event.nativeEvent.offsetX / canvas.width);
                            if (data.player1.x < 0)
                                data.player1.x = 0;
                            else if (data.player1.x > 0.8)
                                data.player1.x = 0.8;
                            socket.emit('move', {idGame: idGame, player: 1, position: data.player1.x});
                        }
                        else if (playerNumber === 2) {
                            data.player2.x = 1 - (event.nativeEvent.offsetX / canvas.width);
                            if (data.player2.x < 0)
                                data.player2.x = 0;
                            else if (data.player2.x > 0.8)
                                data.player2.x = 0.8;
                            socket.emit('move', {idGame: idGame, player: 2, position: data.player2.x});
                        }
                    }
                }}></canvas>
            </div>
        </div>
    );
}

export default Board;