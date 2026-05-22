export type WarehouseStaff = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  areaResponsible: string;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseStaffResponse = WarehouseStaff;

export type WarehouseStaffRequest = {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  areaResponsible?: string;
};
