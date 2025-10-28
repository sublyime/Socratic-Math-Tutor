
import React from 'react';
import { Message, Role } from '../types';
import { User, BrainCircuit } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const textWithLineBreaks = message.text.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
          <BrainCircuit size={24} />
        </div>
      )}

      <div
        className={`p-3 rounded-lg shadow-md max-w-lg md:max-w-xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'
        }`}
      >
        {message.image && (
          <img
            src={message.image}
            alt="Math problem"
            className="rounded-md mb-2 max-h-64 w-auto"
          />
        )}
        <p className="text-sm md:text-base">{textWithLineBreaks}</p>
      </div>

      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-800 dark:text-gray-200 flex-shrink-0">
          <User size={24} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
