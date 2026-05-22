export type Profile = {
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  email: string;
  profileCompleted: boolean;
  registrationDate: string;
}

export type UpdateProfileRequest = {
  fullName: string;
  phoneNumber: string;
  address: string;
}
