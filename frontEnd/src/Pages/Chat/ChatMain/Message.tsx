import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatMain.css';

interface ChatMessageProps {
  message: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
	const navigate = useNavigate();
  
	const renderMessage = (text: string) => {
	  const parts = text.split(/(\b(?:https?|http|ftp):\/\/[^\s\u200B]+)/gi);
  
	  const elements = parts.map((part, index) => {
		if (index % 2 === 0) {
		  return part;
		} else {
		  const url = part;
  
		  const path = new URL(url).pathname;
  
		  return (
			<span
			  key={index}
			  style={{ textDecoration: 'underline', cursor: 'pointer', color: 'blue' }}
			  onClick={() => navigate(path, { replace: true })}
			>
			  {url}
			</span>
		  );
		}
	  });
  
	  return elements;
	};
  
	return (
	  <span className="chatMessage">
		{renderMessage(message)}
	  </span>
	);
  };
  
  export default ChatMessage;