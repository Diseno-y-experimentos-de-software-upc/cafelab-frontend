import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface CoffeeLotListResponse extends BaseResponse {}

/**
 * Respuesta GET del backend ({@code CoffeeLotResource} Java): Jackson serializa en camelCase.
 * Los cuerpos POST/PUT siguen usando snake_case ({@link CreateCoffeeLotResourceBody}, etc.).
 */
export interface CoffeeLotResource extends BaseResource {
  userId: number;
  supplierId: number;
  supplierName: string;
  lotLineageId: number;
  versionNumber: number;
  isCurrent: boolean;
  supersedesId: number | null;
  recordStatus: string;
  annulmentReason: string;
  lotName: string;
  coffeeType: string;
  processingMethod: string;
  altitude: number;
  weight: number;
  originalWeight: number;
  origin: string;
  status: string;
  certifications: string[] | null;
}

export interface CreateCoffeeLotResourceBody {
  supplier_id: number;
  lot_name: string;
  coffee_type: string;
  processing_method: string;
  altitude: number;
  weight: number;
  origin: string;
  status: string;
  certifications: string[];
}

export interface UpdateCoffeeLotResourceBody {
  lot_name: string;
  coffee_type: string;
  processing_method: string;
  altitude: number;
  origin: string;
  status: string;
  certifications: string[];
}

export interface AnnullCoffeeLotResourceBody {
  reason: string;
}