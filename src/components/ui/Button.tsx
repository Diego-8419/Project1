'use client'

/**
 * Modern Button Component mit 3D-Effekten
 */

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-primary text-white shadow-3d hover:shadow-3d-hover hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-secondary text-white shadow-3d hover:shadow-3d-hover hover:-translate-y-0.5 active:translate-y-0',
    danger: 'bg-red-600 text-white shadow-3d hover:shadow-3d-hover hover:-translate-y-0.5 active:translate-y-0',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
