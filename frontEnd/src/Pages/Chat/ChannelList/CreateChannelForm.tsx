import { useState } from "react";
import { Socket } from "socket.io-client";
import './CreateChannelForm.css';

type CreateChannelButtonForm = {
    socket: Socket;
};

const CreateChannelForm: React.FC<CreateChannelButtonForm> = ({ socket }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [isPrivate, setIsPrivate] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (name !== '' && name.trim().length > 0)
            socket.emit('create channel', { name: name, isPrivate: isPrivate, password: password });
        setIsOpen(false);
    }

    const handleInputChange = (e: { target: { name: string; value: string; checked: boolean; }; }) => {
        const { name, value, checked } = e.target;
        if (name === 'name')
            setName(value);
        else if (name === 'password')
            setPassword(value);
        else if (name === 'isPrivate')
            setIsPrivate(checked);
    }
    
    return (
        <>
        <button className="btn" onClick={() => setIsOpen(true)}>Create channel</button>
        {isOpen && (
            <div className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => setIsOpen(false)}>&times;</span>
                    <form onSubmit={handleSubmit} className="channel-form">
                        <label htmlFor="name" className="form-label">Channel name</label>
                        <input className="form-input" type="text" name="name" placeholder="Channel Name" id="name" value={name} onChange={handleInputChange} maxLength={18}/>
                        <label className="form-label" htmlFor="isPrivate">Private channel</label>
                        <input className="form-input" type="checkbox" name="isPrivate" id="isPrivate" checked={isPrivate} onChange={handleInputChange} />
                        <label className="form-label" htmlFor="password">Password</label>
                        <input className="form-input" type="password" name="password" placeholder="password" id="password" value={password} onChange={handleInputChange} maxLength={15}/>
                        <input className="form-submit" type="submit" value="Create" />
                    </form>
                </div>
            </div>
        )
        }
        </>
    );
};

export default CreateChannelForm;