import { useState } from "react";
import AuthCode from "react-auth-code-input";
import { getCookieValue } from "../../utils";
import './TwoFactor.css';
import './buttonTwoFactor.css';
import { useNavigate } from "react-router-dom";

function TwoFactor() {
    const [code, setCode] = useState<string>('');
    const navigate = useNavigate();
    
    const handleChange = (value: string) => {
        setCode(value);
    }

    async function checkTwoFactorCode() {
        const token = getCookieValue('token');

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: token, twoFactorCode: code})
        });
        const data = await response.json();
        if (data === true) {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/twofactor/success`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({token: token, status: true})
            });
            navigate('/');
        }
        return data;
    }

    return (
        <div className='TwoFactorPage'>
            <h1>TwoFactor Authentification</h1>
            <AuthCode
                inputClassName="AuthCode"
                allowedCharacters="numeric"
                onChange={handleChange}
            />
            <button onClick={checkTwoFactorCode} className="btn">Submit</button>
        </div>
    )
}

export default TwoFactor;