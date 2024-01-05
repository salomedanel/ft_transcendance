import React, { useState } from 'react';
import '../style/Toggle.css'; // Assurez-vous de créer un fichier CSS pour les styles

const Toggle: React.FC = () => {
  const [isChecked, setChecked] = useState(false);

  const handleToggle = () => {
    setChecked(!isChecked);
  };

  return (
    <div className={`toggle ${isChecked ? 'on' : 'off'}`} onClick={handleToggle}>
      <input type="checkbox" checked={isChecked} readOnly />
      <div className="slider" />
    </div>
  );
};

export default Toggle;
