import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  error,
  placeholder,
  className,
  ...props
}) => {
  return (
    <select
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
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;

