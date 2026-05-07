export type CompoundUnitType = 'none' | 'ft_in' | 'dozen_pcs' | 'kg_g' | 'lb_oz' | 'm_cm';

export interface CompoundUnitDef {
    label: string;
    primaryUnit: string;
    secondaryUnit: string;
    secondaryPerPrimary: number;
}

export const COMPOUND_UNIT_DEFS: Record<CompoundUnitType, CompoundUnitDef> = {
    none: { label: 'Standard (pcs)', primaryUnit: 'pcs', secondaryUnit: '', secondaryPerPrimary: 1 },
    ft_in: { label: 'Feet + Inches', primaryUnit: 'ft', secondaryUnit: 'in', secondaryPerPrimary: 12 },
    dozen_pcs: { label: 'Dozen + Pieces', primaryUnit: 'doz', secondaryUnit: 'pcs', secondaryPerPrimary: 12 },
    kg_g: { label: 'Kg + Grams', primaryUnit: 'kg', secondaryUnit: 'g', secondaryPerPrimary: 1000 },
    lb_oz: { label: 'Pounds + Ounces', primaryUnit: 'lb', secondaryUnit: 'oz', secondaryPerPrimary: 16 },
    m_cm: { label: 'Meters + Centimeters', primaryUnit: 'm', secondaryUnit: 'cm', secondaryPerPrimary: 100 },
};

export function isCompoundUnit(unitType: string): unitType is CompoundUnitType {
    return unitType in COMPOUND_UNIT_DEFS && unitType !== 'none';
}

/** Convert base-unit value to compound {primary, secondary} parts. */
export function toCompoundParts(baseValue: number, unitType: CompoundUnitType): { primary: number; secondary: number } {
    const def = COMPOUND_UNIT_DEFS[unitType];
    const primary = Math.floor(baseValue / def.secondaryPerPrimary);
    const secondary = Math.round(baseValue % def.secondaryPerPrimary);
    return { primary, secondary };
}

/** Convert compound {primary, secondary} parts to base-unit value. */
export function fromCompoundParts(primary: number, secondary: number, unitType: CompoundUnitType): number {
    const def = COMPOUND_UNIT_DEFS[unitType];
    return primary * def.secondaryPerPrimary + secondary;
}

/** Format a base-unit value as a human-readable compound string. */
export function formatCompoundQty(baseValue: number, unitType: string): string {
    if (!isCompoundUnit(unitType)) {
        return String(baseValue);
    }
    const def = COMPOUND_UNIT_DEFS[unitType];
    const { primary, secondary } = toCompoundParts(baseValue, unitType);
    if (secondary === 0) return `${primary} ${def.primaryUnit}`;
    return `${primary} ${def.primaryUnit} ${secondary} ${def.secondaryUnit}`;
}
