'use client';

import { COMPOUND_UNIT_DEFS, CompoundUnitType, fromCompoundParts, toCompoundParts } from '../lib/compound-units';

interface CompoundUnitInputProps {
    unitType: CompoundUnitType;
    value: number;
    onChange: (baseValue: number) => void;
    min?: number;
    inputClassName?: string;
}

export default function CompoundUnitInput({ unitType, value, onChange, min = 0, inputClassName }: CompoundUnitInputProps) {
    const def = COMPOUND_UNIT_DEFS[unitType];
    const { primary, secondary } = toCompoundParts(value, unitType);

    const handlePrimary = (raw: string) => {
        const p = Math.max(0, parseInt(raw, 10) || 0);
        onChange(fromCompoundParts(p, secondary, unitType));
    };

    const handleSecondary = (raw: string) => {
        const s = Math.max(0, Math.min(def.secondaryPerPrimary - 1, parseInt(raw, 10) || 0));
        onChange(fromCompoundParts(primary, s, unitType));
    };

    const base = inputClassName ?? 'bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20';

    return (
        <div className="flex items-center gap-1">
            <input
                type="number"
                min={0}
                value={primary}
                onChange={(e) => handlePrimary(e.target.value)}
                className={`w-14 text-center ${base}`}
            />
            <span className="text-xs font-bold text-gray-400">{def.primaryUnit}</span>
            <input
                type="number"
                min={0}
                max={def.secondaryPerPrimary - 1}
                value={secondary}
                onChange={(e) => handleSecondary(e.target.value)}
                className={`w-14 text-center ${base}`}
            />
            <span className="text-xs font-bold text-gray-400">{def.secondaryUnit}</span>
        </div>
    );
}
