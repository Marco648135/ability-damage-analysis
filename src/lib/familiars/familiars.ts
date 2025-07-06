/**
 * Interface defining a familiar
 */
export interface Familiar {
    name: string;
    attack_rate: number;
    max_hit: number;
    has_dps_spec: boolean;
    spec_damage: number;
    spec_cost: number;
    combat_style: 'melee' | 'ranged' | 'magic'; // TODO multiple styles
    accuracy: number;
}

/**
 * Available familiars
 */
export const familiars: Record<string, Familiar> = {
    'steel titan': {
        name: 'Steel Titan',
        attack_rate: 6,
        max_hit: 1296,
        has_dps_spec: true,
        spec_damage: 5184/2,
        spec_cost: 18,
        combat_style: 'melee',
        accuracy: 2500
    },
    'ripper demon': {
        name: 'Ripper Demon',
        attack_rate: 6,
        max_hit: 1341,
        has_dps_spec: true,
        spec_damage: 2.6*1341,
        spec_cost: 20,
        combat_style: 'melee',
        accuracy: 2500
    },
    'nihil': {
        name: 'Nihil',
        attack_rate: 5,
        max_hit: 768,
        has_dps_spec: true,
        spec_damage: 768,
        spec_cost: 20,
        combat_style: 'magic',
        accuracy: 2500
    },
    'kalgerion demon': {
        name: 'Kalgerion Demon',
        attack_rate: 4,
        max_hit: 1368,
        has_dps_spec: false,
        spec_damage: 0,
        spec_cost: 0,
        combat_style: 'melee',
        accuracy: 2500
    },
    // 'Blood Reaver': {
    //     name: 'Blood Reaver',
    //     attack_rate: 5,
    //     max_hit: 657,
    //     has_dps_spec: false,
    //     spec_damage: 0,
    //     spec_cost: 0,
    //     combat_style: 'magic',
    //     accuracy: 2500
    // }
};

/**
 * Get a familiar by name
 */
export function getFamiliar(name: string): Familiar | undefined {
    return familiars[name];
}