import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface CuppingSessionListResponse extends BaseResponse {}

export interface CuppingSessionResource extends BaseResource {
  userId: number;
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string | number[] | unknown;
  favorite: boolean;
  resultsJson: string | null;
  roastStyleNotes: string | null;
  coffeeLotId: number | null;
  roastProfileId: number | null;
}

export interface CreateCuppingSessionBody {
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string;
  favorite?: boolean;
  resultsJson?: string | null;
  roastStyleNotes?: string | null;
  coffeeLotId?: number | null;
  roastProfileId?: number | null;
}

export interface UpdateCuppingSessionBody {
  name: string;
  origin: string;
  variety: string;
  processing: string;
  sessionDate: string;
  favorite: boolean;
  resultsJson?: string | null;
  roastStyleNotes?: string | null;
  coffeeLotId?: number | null;
  roastProfileId?: number | null;
}