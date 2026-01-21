import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input: React.FC<InputProps> = ({ className, error, ...props }) => {
  return (
    <input
      className={clsx(
        'w-full px-3 py-2 border rounded text-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:bg-gray-50 disabled:cursor-not-allowed',
        {
          'border-gray-300': !error,
          'border-red-500': error,
        },
        className
      )}
      {...props}
    />
  );
};

export default Input;

