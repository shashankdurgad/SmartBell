import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-600 text-gray-light',
  blue: 'bg-blue-primary/20 text-blue-light',
  green: 'bg-green-accent/20 text-green-accent',
  yellow: 'bg-yellow-accent/20 text-yellow-accent',
  red: 'bg-red-accent/20 text-red-accent',
  purple: 'bg-purple-600/60 text-purple-accent',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
