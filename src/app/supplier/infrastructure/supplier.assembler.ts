import type { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import type { Supplier } from '../domain/model/supplier.entity';
import type {
  CreateSupplierResource,
  SupplierListResponse,
  SupplierResource,
  UpdateSupplierResource,
} from './supplier.response';

export class SupplierAssembler
  implements BaseAssembler<Supplier, SupplierResource, SupplierListResponse>
{
  toEntityFromResource(resource: SupplierResource): Supplier {
    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name ?? '',
      email: resource.email ?? '',
      phone: Number(resource.phone),
      location: resource.location ?? '',
      specialties: resource.specialties ? [...resource.specialties] : [],
    };
  }

  toResourceFromEntity(entity: Supplier): SupplierResource {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      email: entity.email,
      phone: Number(entity.phone),
      location: entity.location,
      specialties: entity.specialties ?? [],
    };
  }

  toEntitiesFromResponse(_response: SupplierListResponse): Supplier[] {
    return [];
  }

  toCreateResource(entity: Supplier): CreateSupplierResource {
    return {
      name: entity.name.trim(),
      email: entity.email.trim().toLowerCase(),
      phone: Number(entity.phone),
      location: entity.location.trim(),
      specialties: entity.specialties ?? [],
    };
  }

  toUpdateResource(entity: Supplier): UpdateSupplierResource {
    return {
      name: entity.name.trim(),
      email: entity.email.trim().toLowerCase(),
      phone: Number(entity.phone),
      location: entity.location.trim(),
      specialties: entity.specialties ?? [],
    };
  }
}
