import type { BaseResource, BaseResponse } from '../../shared/infrastructure/base-resource';

export interface DefectLibraryListResponse extends BaseResponse {}

export interface DefectLibraryResource extends BaseResource {
  userId: number | null;
  coffeeDisplayName: string | null;
  coffeeRegion: string | null;
  coffeeVariety: string | null;
  coffeeTotalWeight: number | null;
  name: string;
  defectType: string;
  defectWeight: number;
  percentage: number;
  probableCause: string;
  suggestedSolution: string;
}

export interface CreateDefectLibraryBody {
  coffeeDisplayName: string;
  coffeeRegion?: string;
  coffeeVariety: string;
  coffeeTotalWeight?: number;
  name: string;
  defectType: string;
  defectWeight: number;
  percentage: number;
  probableCause: string;
  suggestedSolution: string;
}