import React from 'react';
import clsx from 'clsx';

interface FormItemProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  labelWidth?: string;
}

const FormItem: React.FC<FormItemProps> = ({
  label,
  required = false,
  error,
  children,
  className,
  labelWidth = '100px',
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      <div className="flex items-start">
        <label
          className={clsx(
            'flex-shrink-0 pt-2 text-sm font-medium text-gray-700',
            required && "after:content-['*'] after:ml-1 after:text-red-500"
          )}
          style={{ width: labelWidth }}
        >
          {label}
        </label>
        <div className="flex-1">
          {children}
          {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default FormItem;

