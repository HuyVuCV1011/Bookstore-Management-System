import React, { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  variant?: 'default' | 'floating';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', variant = 'default', className = '', style, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const isFloating = variant === 'floating';

    return (
      <div className="relative w-full">
        {!isFloating && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              auth-input peer h-12 w-full rounded-input border px-4 py-3
              text-gray-800 transition-all duration-200
              ${isFloating ? 'bg-white/95 placeholder-transparent' : 'bg-white placeholder:text-gray-400'}
              ${error
                ? 'border-error focus:border-error focus:shadow-[0_0_0_2px_rgba(192,57,43,0.18)]'
                : 'border-border focus:border-primary focus:shadow-input-focus'
              }
              outline-none
              ${className}
            `}
            style={{
              fontSize: '16px',
              lineHeight: '24px',
              fontWeight: 400,
              ...style,
            }}
            placeholder={props.placeholder || label}
            {...props}
          />

          {isFloating && (
            <label
              className={`
                pointer-events-none absolute left-4 bg-white/95 px-1 transition-all duration-200
                top-3 text-base
                peer-focus:-top-2.5 peer-focus:text-xs
                peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-xs
                peer-autofill:-top-2.5 peer-autofill:text-xs
                ${error ? 'text-error' : 'text-text-secondary peer-focus:text-primary'}
              `}
            >
              {label}
            </label>
          )}

          {/* Show/Hide Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1 mt-1 text-sm text-error">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
