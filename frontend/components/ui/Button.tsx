'use client';

import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, type = 'button', ...props }, ref) => {
        const baseStyles = "rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";

        const variants = {
            primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 border border-transparent",
            secondary: "border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 bg-transparent",
            danger: "bg-red-600 hover:bg-red-700 text-white border border-transparent",
            ghost: "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent bg-transparent",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base",
        };

        return (
            <button
                type={type}
                ref={ref}
                disabled={disabled || loading}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading...</span>
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);
Button.displayName = "Button";

export default Button;
