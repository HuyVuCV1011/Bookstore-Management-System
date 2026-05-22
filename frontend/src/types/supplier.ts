export type Supplier = {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

export type SupplierRequest = {
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address?: string;
  paymentTerms?: string;
};
