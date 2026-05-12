import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface RoastProfileListResponse extends BaseResponse {}

/** Respuesta API; el lote viene como {@code lot} (o {@code coffeeLotId} en respuestas antiguas). */
export interface RoastProfileResource extends BaseResource {
  userId: number;
  name: string;
  type: string;
  duration: number;
  tempStart: number;
  tempEnd: number;
  isFavorite: boolean;
  createdAt: string;
  lot?: number;
  coffeeLotId?: number;
}

export interface CreateRoastProfileBody {
  name: string;
  type: string;
  duration: number;
  tempStart: number;
  tempEnd: number;
  lot: number;
  isFavorite?: boolean;
}

export interface UpdateRoastProfileBody {
  name: string;
  type: string;
  duration: number;
  tempStart: number;
  tempEnd: number;
  lot: number;
  isFavorite: boolean;
}