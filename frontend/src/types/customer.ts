export interface Customer {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  address: string;
}
