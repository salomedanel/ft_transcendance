import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-column">
        <h4>Copyright</h4>
        <p>&copy; 2023 TSA - Thomas Shlo Alexis</p>
      </div>
      <div className="footer-column">
        <h4>Techno</h4>
        <ul>
          <li>React</li>
          <li>TypeScript</li>
          <li>NestJS</li>
          <li>Prisma</li>
          <li>PostgreSQL</li>
          <li>Docker</li>
        </ul>
      </div>
      <div className="footer-column">
        <h4>Contact</h4>
        <p>Email: contact@exemple.com</p>
        <p>Téléphone: +33 6 12 34 56 78</p>
      </div>
    </footer>
  );
};

export default Footer;
