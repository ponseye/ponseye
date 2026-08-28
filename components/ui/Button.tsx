'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:ring-offset-1 focus:ring-offset-black'

  const variants = {
    primary:
      'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-950/40 border border-emerald-400/30 active:scale-[0.98]',
    secondary:
      'bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-200 border border-white/[0.08] hover:border-emerald-500/30 backdrop-blur-md active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-emerald-950/30 text-zinc-400 hover:text-emerald-300',
    danger:
      'bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30',
    accent:
      'bg-zinc-950/80 hover:bg-zinc-900/90 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 backdrop-blur-md',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
