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
      contactPerson: resource.contactPerson ?? '',
      webLink: resource.webLink ?? '',
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
      contactPerson: entity.contactPerson ?? '',
      webLink: entity.webLink ?? '',
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
      contactPerson: entity.contactPerson?.trim() || undefined,
      webLink: entity.webLink?.trim() || undefined,
    };
  }

  toUpdateResource(entity: Supplier): UpdateSupplierResource {
    return {
      name: entity.name.trim(),
      email: entity.email.trim().toLowerCase(),
      phone: Number(entity.phone),
      location: entity.location.trim(),
      specialties: entity.specialties ?? [],
      contactPerson: entity.contactPerson?.trim() || undefined,
      webLink: entity.webLink?.trim() || undefined,
    };
  }
}
