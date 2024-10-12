import { hit_damage_calculation, ability_damage_calculation } from '../new_stuff/damage_calc.js';
import { ABILITIES } from '../new_stuff/const.js';

const abilities = {
    [ABILITIES.NECRO_AUTO]: {
		title: 'Necro auto',
		calc: hit_damage_calculation,
		icon: '/ability_icons/necro/30x30/auto.png'
	},
};

export { abilities };
