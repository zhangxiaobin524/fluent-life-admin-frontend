import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  extra?: React.ReactNode;
  bordered?: boolean;
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  extra,
  bordered = true,
  shadow = false,
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded',
        {
          'border border-gray-200': bordered,
          'shadow-sm': shadow,
        },
        className
      )}
    >
      {(title || extra) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className={title || extra ? 'p-6' : 'p-6'}>{children}</div>
    </div>
  );
};

export default Card;

