import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import type { CustomerRequest } from '../../../types/customer';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  fullName: z.string().min(1, 'Full name is required').max(255),
  phoneNumber: z.string().regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format'),
  address: z.string().min(1, 'Address is required'),
});

interface CustomerFormProps {
  initialData?: CustomerRequest & { id?: string };
  onSubmit: (data: CustomerRequest) => Promise<void>;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CustomerRequest>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('email')}
        label="Email"
        type="email"
        error={errors.email?.message}
      />

      <Input
        {...register('password')}
        label={initialData ? 'Password (leave blank to keep current)' : 'Password'}
        type="password"
        error={errors.password?.message}
      />

      <Input
        {...register('fullName')}
        label="Full Name"
        error={errors.fullName?.message}
      />

      <Input
        {...register('phoneNumber')}
        label="Phone Number"
        error={errors.phoneNumber?.message}
      />

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          {...register('address')}
          className="w-full rounded-input border border-border bg-white px-4 py-2 text-sm text-gray-800 outline-none transition focus:border-primary focus:shadow-input-focus"
          rows={3}
        />
        {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-button border border-border bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
        <Button type="submit" loading={isSubmitting} className="!w-auto !px-5 !py-2 !text-sm">
          Save
        </Button>
      </div>
    </form>
  );
};
