import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ className, children, hover = true, ...props }: any) => {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-5 shadow-sm border-b-4 border-gray-200 border-x border-t border-gray-100',
        hover && 'transition-all hover:translate-y-[-2px] hover:shadow-md active:translate-y-[2px] active:border-b-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-gray-500', className)} {...props}>
    {children}
  </p>
);
