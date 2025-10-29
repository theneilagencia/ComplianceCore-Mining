/**
 * QivoLayout - Layout component with Qivo Design System
 * Provides consistent styling across all pages
 */

import { ReactNode } from 'react';

interface QivoLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'auth' | 'dashboard';
}

export function QivoLayout({ children, className = '', variant = 'default' }: QivoLayoutProps) {
  const baseClasses = "min-h-screen";
  
  const variantClasses = {
    default: "bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79]",
    auth: "bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79] flex items-center justify-center p-4",
    dashboard: "bg-[#000020]"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface QivoCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'outline';
}

export function QivoCard({ children, className = '', variant = 'glass' }: QivoCardProps) {
  const variantClasses = {
    glass: "bg-white/5/10 backdrop-blur-sm border border-white/20",
    solid: "bg-white/5/5 border border-white/10",
    outline: "bg-transparent border border-white/20"
  };

  return (
    <div className={`rounded-2xl shadow-2xl ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface QivoButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function QivoButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: QivoButtonProps) {
  const baseClasses = "font-semibold rounded-lg transition-all disabled:opacity-50";
  
  const variantClasses = {
    primary: "bg-[#2f2c79] text-white hover:bg-[#b96e48]",
    secondary: "bg-[#b96e48] text-white hover:bg-[#8d4925]",
    outline: "bg-transparent border-2 border-white/20 text-white hover:bg-white/5/10",
    ghost: "bg-transparent text-white hover:bg-white/5/10"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}

interface QivoInputProps {
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export function QivoInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  label
}: QivoInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-white mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-white/5/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-[#b96e48] focus:border-transparent placeholder:text-gray-400 ${className}`}
      />
    </div>
  );
}

export function QivoLogo({ className = '' }: { className?: string }) {
  return (
    <img 
      src="/assets/logo-Qivo.png" 
      alt="QIVO Mining" 
      className={`h-8 w-auto ${className}`}
    />
  );
}

