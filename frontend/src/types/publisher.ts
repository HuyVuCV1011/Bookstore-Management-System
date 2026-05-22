export interface Publisher {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublisherRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}
