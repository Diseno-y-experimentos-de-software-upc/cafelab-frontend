export interface Supplier {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: number;
  location: string;
  specialties: string[];
  contactPerson?: string;
  webLink?: string;
}