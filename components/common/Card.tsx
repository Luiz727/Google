import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white dark:bg-nixcon-dark-card dark:border dark:border-gray-700 rounded-lg shadow p-4 sm:p-6 ${className} transition-colors duration-300`}>
      {title && <h3 className="text-lg font-medium text-nixcon-dark dark:text-nixcon-light mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;