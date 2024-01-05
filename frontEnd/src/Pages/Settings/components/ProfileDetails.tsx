import '../style/ProfileDetails.css';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { getCookieValue } from '../../../utils';
import defaultAvatar from '../../../assets/default.jpg';
import axios from 'axios';
import AuthCode from 'react-auth-code-input';
import { useNavigate } from 'react-router';


const ProfileDetails: React.FC<{
    avatar: File | null;
    setAvatar: React.Dispatch<React.SetStateAction<File | null>>;
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
  }> = ({ avatar, setAvatar, username, setUsername }) => {
  const [token, setToken] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [checked, setChecked] = useState<boolean>(false);
  const [twoFactorActivated, setTwoFactorActivated] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
      if (token !== '') {
          checkTwoFactorStatus(token).then((status: any) => status.json()).then((status: any) => {
                setChecked(status.twoFactorAuth);
                setTwoFactorActivated(status.twoFactorActivated);
          })
      }
      const cookieToken = getCookieValue('token');
      if (cookieToken)
          setToken(cookieToken);
	  if (!cookieToken)
	  	navigate('/');
  }, [token]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
    if (!checked === false) {
        setTwoFactorActivated(false);
        fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: token, twoFactorActive: false})
        });
        fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/success`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: token, status: false})
        });
    }
    axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/enable`, { token, twoFactorAuth: !checked }).then (() => {
        generateQrCode();
    }).catch(error => {
        console.log(error);
    });
  };

    const handleOnChange = (code: string) => {
        setTwoFactorCode(code);
    }

    async function generateQrCode() {
        try {
            const responste = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({token: token})
            });
            const data = await responste.json();
            if (data) {
                setQrCodeUrl(data);
                setTwoFactorActivated(false);
                return data;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function activateTwoFactor() {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: token, twoFactorCode: twoFactorCode})
        });
        const data = await response.json();
        if (data) {
            setTwoFactorActivated(true);
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({token: token, twoFactorActive: true})
            });
            fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/success`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({token: token, status: true})
            });
        }
        return data;
    }

    async function checkTwoFactorStatus(token: string): Promise<any> {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    const handleCancel = () => {
        setChecked(false);
    }

    const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value);
    };

    const hasSpecialCharacters = (username: string): boolean => {
        const regex = /^[a-zA-Z0-9_]+$/;
      
        return !regex.test(username);
      };

    const handleNameSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(newUsername);
        if (newUsername.length < 3 || hasSpecialCharacters(newUsername) || await checkUsernameExists(newUsername))
            return;
        console.log(newUsername);
        await setUsernameHandler(newUsername);
        setNewUsername('');
    }

    async function setUsernameHandler(username: string) {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/username`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
                body: JSON.stringify({
                    username: username
                })
            });
            const data = await response.json();
            console.log(data.username);
            console.log("HUH")
            if (data.username)
                setUsername(data.username);
        } catch (error) {
            console.log(error);
        }
    }

    async function checkUsernameExists(username: string) {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/checkusername`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
          });
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          const data = await response.json();
          return data.exists;
        } catch (error) {
          console.error('Error checking username:', error);
          return false;
        }
      }

    const handleAvatarSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formElement = e.target as HTMLFormElement;
        const fileInput = formElement.querySelector<HTMLInputElement>('#avatarInput');

        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return;
        }

    const selectedFile = fileInput.files[0];

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(selectedFile.type)) {
            alert('Invalid file type. Please upload an image.');
        return;
    }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/files/${username}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/users/me/avatar`, {
                token: token,
                username: username,
            });

            setAvatar(selectedFile);

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (token !== '' && username !== '') {
            const fetchData = async () => {
                getAvatar();
            };
            fetchData();
        }
        const cookieToken = getCookieValue('token');
        if (cookieToken)
            setToken(cookieToken);
    }, [token, username]);

  async function getAvatar() {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Username': `${username}`
        },
    });
    if (response.status === 404) {
        return;
    }
    const blob = await response.blob();
    const newFile = new File([blob], 'profilePicture', { type: 'image/png' });
    setAvatar(newFile);
    }

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (checked)
                setChecked(false);
            };
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }, [checked]);

  return (
    <div className='container'>
    <div className='column'>
        <img src={avatar ? URL.createObjectURL(avatar) : defaultAvatar} className='profile-picture' alt='Profile' />
        <div className='button-container'>
        <form id="AvatarForm" onSubmit={handleAvatarSubmit} className="avatar-form">
                <label htmlFor="avatarInput" className="avatar-label">Change Avatar: </label>
                <input id="avatarInput" type="file" accept="image/*" className="avatar-input" /> 
                <button className='SubmitButton' type="submit">Submit</button>
            </form>
        </div>
    </div>
    <div className='column'>
        <p>Username: {username}</p>
        <div className='button-container'>
        <form id="UsernameForm" className='ProfileForm' onSubmit={handleNameSubmit}>
                <label htmlFor="usernameInput" className='avatar-label'>Change Username: </label>
                <input id="usernameInput" className='UsernameInput' type="text" value={newUsername} onChange={handleUsernameChange} placeholder="At least 3 characters" />
                <button className='SubmitButton' type="submit">Submit</button>
        </form>
        </div>
    </div>
    <div className='column'>
        <p>Two-Factor Authentification</p>
        <label className="switch">
            <input type="checkbox" checked={checked} onChange={handleChange} className="input__check"/>
            <span className="slider"></span>
        </label>
        {checked && (
            <>
            {!twoFactorActivated && qrCodeUrl && (
                <>
                    <img src={qrCodeUrl} alt="QR Code" />
                    <div className='AuthBlock'>
                        <AuthCode allowedCharacters="numeric" onChange={handleOnChange} inputClassName='AuthInput '/>
                        <button id="activateTwoFactor" onClick={activateTwoFactor}>Submit</button>
                        <button id="activateTwoFactor" onClick={handleCancel}>Close</button>
                    </div>
                </>
                )}
            </>
            )}
    </div>
    </div>
  );
};

export default ProfileDetails;