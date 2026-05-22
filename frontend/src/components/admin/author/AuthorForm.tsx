import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import type { AuthorRequest } from '../../../types/author';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  biography: z.string().optional(),
});

interface AuthorFormProps {
  initialData?: AuthorRequest;
  onSubmit: (data: AuthorRequest) => Promise<void>;
  onCancel: () => void;
}

export const AuthorForm: React.FC<AuthorFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthorRequest>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register('name')} label="Name" error={errors.name?.message} />
      <div>
        <label className="block text-sm font-medium mb-1">Biography</label>
        <textarea
          {...register('biography')}
          className="w-full rounded-input border border-border bg-white px-4 py-2 text-sm text-gray-800 outline-none transition focus:border-primary focus:shadow-input-focus"
          rows={4}
        />
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
