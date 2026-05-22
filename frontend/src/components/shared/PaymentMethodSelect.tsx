// frontend/src/components/shared/PaymentMethodSelect.tsx
import React from 'react';
import type { PaymentMethod } from '../../types/order';

interface PaymentMethodSelectProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  required = false
}) => {
  const paymentMethods: { value: PaymentMethod; label: string; icon: string; description: string }[] = [
    { value: 'CASH', label: 'Tiền mặt', icon: '💵', description: 'Thanh toán khi nhận hàng' },
    { value: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: '🏦', description: 'Chuyển khoản ngân hàng' },
    { value: 'CREDIT_CARD', label: 'Thẻ tín dụng', icon: '💳', description: 'Visa, Mastercard, v.v.' },
    { value: 'E_WALLET', label: 'Ví điện tử', icon: '📱', description: 'Thanh toán qua ví điện tử' }
  ];

  return (
    <div>
      <label className="block text-[15px] font-medium text-gray-700 mb-3">
        Phương thức thanh toán {required && <span className="text-error">*</span>}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods.map(method => (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-[1.02] ${
              value === method.value
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{method.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {method.label}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {method.description}
                </div>
              </div>
              {value === method.value && (
                <span className="text-primary text-xl">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
      {error && helperText && (
        <p className="text-sm text-red-500 mt-2">{helperText}</p>
      )}
    </div>
  );
};

export default PaymentMethodSelect;
