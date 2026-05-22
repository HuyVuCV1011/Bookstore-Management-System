import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import type { WarehouseStaffRequest, WarehouseStaffResponse } from '../../../types/staff';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  fullName: z.string().min(1, 'Full name is required').max(255),
  phoneNumber: z.string().regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format'),
  areaResponsible: z.string().max(100, 'Area name must not exceed 100 characters').optional().or(z.literal('')),
});

interface StaffFormProps {
  initialData?: WarehouseStaffResponse;
  onSubmit: (data: WarehouseStaffRequest) => Promise<void>;
  onCancel: () => void;
}

export const StaffForm: React.FC<StaffFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<WarehouseStaffRequest>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      email: initialData.email,
      password: '',
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber,
      areaResponsible: initialData.areaResponsible,
    } : undefined,
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
        type="tel"
        error={errors.phoneNumber?.message}
      />

      <Input
        {...register('areaResponsible')}
        label="Area Responsible"
        placeholder="e.g., Main Warehouse, Section A"
        error={errors.areaResponsible?.message}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
