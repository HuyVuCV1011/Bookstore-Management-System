import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import type { BookRequest } from '../../../types/book';
import { categoryApi } from '../../../services/api/categoryApi';
import { authorApi } from '../../../services/api/authorApi';
import { publisherApi } from '../../../services/api/publisherApi';
import type { Category } from '../../../types/category';
import type { Author } from '../../../types/author';
import type { Publisher } from '../../../types/publisher';

const currentYear = new Date().getFullYear();

const schema = z.object({
  title: z.string().min(1, 'Book title is required').max(255),
  isbn: z.string().regex(/^\d{10}$|^\d{13}$/, 'ISBN must contain 10 or 13 digits').optional().or(z.literal('')),
  coverUrl: z.string().url('Invalid cover image URL').optional().or(z.literal('')),
  publicationYear: z.number().min(1900, 'Publication year must be 1900 or later').max(currentYear, `Publication year cannot exceed ${currentYear}`),
  price: z.number().positive('Price must be greater than 0'),
  stockQuantity: z.number().min(0, 'Stock cannot be negative').default(0),
  description: z.string().optional(),
  businessStatus: z.enum(['ACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK']),
  storageLocation: z.string().max(100).optional(),
  categoryId: z.number().positive('Please select a category'),
  authorId: z.number().positive('Please select an author'),
  publisherId: z.number().positive('Please select a publisher'),
});

interface BookFormProps {
  initialData?: BookRequest;
  onSubmit: (data: BookRequest) => Promise<void>;
  onCancel: () => void;
}

export const BookForm: React.FC<BookFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BookRequest>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, authRes, pubRes] = await Promise.all([
          categoryApi.getAll(0, 100),
          authorApi.getAll(0, 100),
          publisherApi.getAll(0, 100),
        ]);
        setCategories(catRes.data.content);
        setAuthors(authRes.data.content);
        setPublishers(pubRes.data.content);
      } catch (error) {
        console.error('Failed to fetch dropdown data', error);
      }
    };
    fetchData();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input {...register('title')} label="Book title" error={errors.title?.message} />
        </div>

        <Input {...register('isbn')} label="ISBN" error={errors.isbn?.message} />

        <Input {...register('coverUrl')} label="Cover image URL" error={errors.coverUrl?.message} />

        <Input
          {...register('publicationYear', { valueAsNumber: true })}
          label="Publication year"
          type="number"
          error={errors.publicationYear?.message}
        />

        <Input
          {...register('price', { valueAsNumber: true })}
          label="Price"
          type="number"
          step="0.01"
          error={errors.price?.message}
        />

        <Input
          {...register('stockQuantity', { valueAsNumber: true })}
          label="Stock"
          type="number"
          defaultValue="0"
          error={errors.stockQuantity?.message}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField label="Category" error={errors.categoryId?.message}>
          <select {...register('categoryId', { valueAsNumber: true })} className="admin-select">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Author" error={errors.authorId?.message}>
          <select {...register('authorId', { valueAsNumber: true })} className="admin-select">
            <option value="">Select author</option>
            {authors.map((auth) => (
              <option key={auth.id} value={auth.id}>{auth.name}</option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Publisher" error={errors.publisherId?.message}>
          <select {...register('publisherId', { valueAsNumber: true })} className="admin-select">
            <option value="">Select publisher</option>
            {publishers.map((pub) => (
              <option key={pub.id} value={pub.id}>{pub.name}</option>
            ))}
          </select>
        </SelectField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Business status" error={errors.businessStatus?.message}>
          <select {...register('businessStatus')} className="admin-select">
            <option value="ACTIVE">Active</option>
            <option value="DISCONTINUED">Discontinued</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </SelectField>

        <Input {...register('storageLocation')} label="Storage location" error={errors.storageLocation?.message} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
        <textarea
          {...register('description')}
          className="min-h-28 w-full rounded-input border border-border bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:shadow-input-focus"
          rows={4}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-button border border-border bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
        <Button type="submit" loading={isSubmitting} className="!w-full !px-5 !py-2.5 !text-sm sm:!w-auto">
          Save book
        </Button>
      </div>
    </form>
  );
};

const SelectField: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({
  label,
  error,
  children,
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-error">{error}</p>}
  </div>
);
