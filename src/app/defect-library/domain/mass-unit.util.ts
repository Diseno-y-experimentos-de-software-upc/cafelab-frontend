export type MassUnit = 'g' | 'kg';

/**
 * Convierte el valor ingresado con su unidad a gramos (valor único persistido en el API).
 */
export function massInputToGrams(value: number, unit: MassUnit): number {
  return unit === 'kg' ? value * 1000 : value;
}
