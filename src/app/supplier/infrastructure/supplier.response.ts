import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface SupplierListResponse extends BaseResponse {}

/**
 * DTO alineado con {@code SupplierResource} del backend (lectura / respuesta POST-PUT).
 */
export interface SupplierResource extends BaseResource {
  userId: number;
  name: string;
  email: string;
  phone: number;
  location: string;
  specialties: string[];
  contactPerson?: string;
  webLink?: string;
}

export interface CreateSupplierResource {
  name: string;
  email: string;
  phone: number;
  location: string;
  specialties: string[];
  contactPerson?: string;
  webLink?: string;
}

export interface UpdateSupplierResource {
  name: string;
  email: string;
  phone: number;
  location: string;
  specialties: string[];
  contactPerson?: string;
  webLink?: string;
}

export interface MessageResource {
  message: string;
}