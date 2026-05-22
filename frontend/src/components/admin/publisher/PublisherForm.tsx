import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import type { PublisherRequest } from '../../../types/publisher';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

interface PublisherFormProps {
  initialData?: PublisherRequest;
  onSubmit: (data: PublisherRequest) => Promise<void>;
  onCancel: () => void;
}

export const PublisherForm: React.FC<PublisherFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PublisherRequest>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register('name')} label="Name" error={errors.name?.message} />
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          {...register('address')}
          className="w-full rounded-input border border-border bg-white px-4 py-2 text-sm text-gray-800 outline-none transition focus:border-primary focus:shadow-input-focus"
          rows={2}
        />
      </div>
      <Input {...register('phone')} label="Phone" error={errors.phone?.message} />
      <Input {...register('email')} label="Email" type="email" error={errors.email?.message} />
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
