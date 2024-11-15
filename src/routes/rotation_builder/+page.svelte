<script>
	import Navbar from '$components/Layout/Navbar.svelte';
	import Header from '$components/Layout/Header.svelte';
	import { abilities  as r_dmg_abilities } from '$lib/ranged/abilities';
	import { ranged_buff_abilities } from '$lib/ranged/buff_abilities';
	import { settingsConfig, SETTINGS } from '$lib/calc/settings';
	import Checkbox from '../../components/Settings/Checkbox.svelte';
	import Number from '../../components/Settings/Number.svelte';
	import Select from '../../components/Settings/Select.svelte';
	import { ABILITIES, abils } from '$lib/calc/const.js';
	import { hit_damage_calculation, ability_damage_calculation } from '$lib/calc/damage_calc.js';
	import { calc_on_cast, rotation_on_npc, rotation_ability_damage, handle_ranged_buffs, handle_edraco, handle_sgb } from '$lib/calc/rotation_damage_helper.js';

	let rangedAbils = {...r_dmg_abilities, ...ranged_buff_abilities}

	let damages = Object.fromEntries(
		Object.entries(r_dmg_abilities).map(([key, value]) => [
			key, 
			{ ...value, regular: 0, ss: 0, swift: 0, ssSwift: 0 }
		])
	);

	let settings = Object.fromEntries(
		Object.entries(settingsConfig).map(([key, value]) => [
			key,
			{ ...value, key: key, value: value.default }
		])
	);

	updateDamages();

	function updateDamages() {
		const adaptedSettings = Object.fromEntries(
			Object.entries(settings).map(([key, value]) => [key, value.value])
		);
 
		Object.entries(damages).forEach(([abilityKey, ability]) => {
			adaptedSettings['ability'] = abilityKey;

			adaptedSettings['split soul'] = false;
			adaptedSettings['death swiftness'] = false;
			damages[abilityKey].regular = ability.calc({ ...adaptedSettings });

			adaptedSettings['split soul'] = true;
			adaptedSettings['death swiftness'] = false;
			damages[abilityKey].ss = ability.calc({ ...adaptedSettings });

			adaptedSettings['split soul'] = false;
			adaptedSettings['death swiftness'] = true;
			damages[abilityKey].swift = ability.calc({ ...adaptedSettings });

			adaptedSettings['split soul'] = true;
			adaptedSettings['death swiftness'] = true;
			damages[abilityKey].ssSwift = ability.calc({ ...adaptedSettings });
		});
	}

    	let totalDamage = 0;	
	function calculateTotalDamage2() {
		let dmgs = [];
		totalDamage = 0;
		
        	const adaptedSettings = Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, value.value]));
		const settingsCopy = structuredClone(adaptedSettings);
		
		let tick = 0;  // TODO implement ticks properly
		let damageTracker = {};
		let timers = {}; //TODO decrement timers
		let hit_delay = 1; //TODO actually implement this
		let gcd = 0;
		let start_tick = tick;
		let end_tick = 1000; // random large number
		// Cast the ability - calculate up to core, then assign the damage 
		//object(s) to the tick(s) it(they) will land
		let finished = false;
		//TODO allow non ability actions
		//TODO change to ticks
	        abilityBar.forEach(abilityKey => {
			start_tick = tick;
				
	            if (abilityKey != null) {
			settingsCopy['ability'] = abilityKey;
			if (abilityKey in rangedAbils) {
				let hit_tick = tick + hit_delay;
				//Handle single-hit abilities
				if (!damageTracker[hit_tick]) {
						damageTracker[hit_tick] = []; 
					}
				if (rangedAbils[abilityKey].calc == hit_damage_calculation) {
					let cast_damage_object = calc_on_cast(settingsCopy);
					cast_damage_object['non_crit']['ability'] = abilityKey;
					damageTracker[hit_tick].push(cast_damage_object);
	
					if (abilityKey == 'crystal rain') {
						handle_sgb(settingsCopy, cast_damage_object, damageTracker, hit_tick);
					}
				}
				//Handle multi-hit abilities
				else {
					console.log(abils[abilityKey]['ability classification']);
		                        if (abils[abilityKey]['ability classification'] == 'channel') {
		                            //TODO BODY
	                        	}
					let cast_damage_object = rotation_ability_damage(settingsCopy);
					let i = 0;
					cast_damage_object.forEach(hitsplat_dist => {
						hitsplat_dist['non_crit']['ability'] = abilityKey;
						//handle hit delay properly by casting on the correct tick
						let hit_tick_n = hit_tick + abils[abilityKey].hit_timings[i];
						if (!damageTracker[hit_tick_n]) {
							damageTracker[hit_tick_n] = []; 
						}
						damageTracker[hit_tick_n].push(hitsplat_dist);
						i++;
					});
					if (abilityKey == 'rapid fire') {
						handle_edraco(settingsCopy, timers);
					}
				}
			}
			if (abilityKey in ranged_buff_abilities) {
				handle_ranged_buffs(settingsCopy, timers, abilityKey);
			}
			let abil_duration = 3; //assume ability is 3t unless duration is explicitly specified
			if (abils[abilityKey]['duration']) {
				abil_duration = abils[abilityKey]['duration'] ;
			}
			//Process hitsplats and decrement timers 
			for (let i = start_tick; i < start_tick + abil_duration; i++) {
				if (Object.keys(timers).length > 0) {
					for (let key in timers) {
						timers[key] -= 1;
						if (timers[key] < 0) {
							settingsCopy[key] = false;
							}
						}
					}
					if (damageTracker[i]) {
						damageTracker[i].forEach(namedDmgObject => {
							settingsCopy['ability'] = namedDmgObject['non_crit']['ability'];
							dmgs.push(rotation_on_npc(settingsCopy, namedDmgObject));
						});
						console.log('Tick: (' + i + ') --- Total Damage: ' + dmgs.reduce((acc, current) => acc + current, 0));
					}
					tick += 1;
			}
			end_tick = tick;
            	}
        });
	//TODO remove this dogshit code and handle better 
	for (let i = end_tick; i < end_tick + 10; i++) {
		if (Object.keys(timers).length > 0) {
			for (let key in timers) {
				timers[key] -= 1;
				if (timers[key] < 0) {
					settingsCopy[key] = false;
				}
			}
		}
		if (damageTracker[i]) {
			damageTracker[i].forEach(namedDmgObject => {
				settingsCopy['ability'] = namedDmgObject['non_crit']['ability'];
				dmgs.push(rotation_on_npc(settingsCopy, namedDmgObject));
			});
			console.log('Tick: (' + i + ') --- Total Damage: ' + dmgs.reduce((acc, current) => acc + current, 0));
		}
		tick += 1;
	}
		totalDamage = dmgs.reduce((acc, current) => acc + current, 0);
		console.log(totalDamage);
	}

    let abilityBar = Array(500).fill(null); // Empty slots on the bar
	let tab = 'general'; // settings tab

	// abilityBar[0] = "greater death\'s swiftness";
	// abilityBar[1] = "split soul ecb";
	// abilityBar[2] = "rapid fire";
	// abilityBar[3] = "crystal rain";
	// abilityBar[4] = "snap shot";
	// abilityBar[5] = "greater ricochet";
	// abilityBar[6] = "descent of darkness";
	// abilityBar[7] = "shadow tendrils";
	
    //abilityBar[0] = "rapid fire";
	//abilityBar[1] = "crystal rain";
	let abilityBarIndex = 0;
	let buffTimings = {'swiftness': [], 'sunshine': [], 'berserk': [], 'split soul ecb': [], 'crit buff': []}; //tracks when buffs are active for drawing visual indicator
	function handleAbilityClick(event, abilityKey) {

		abilityBar[abilityBarIndex] = abilityKey;
		
		// console.log('Key = ' + abilityKey);
		// console.log('Key = ' + ABILITIES['GREATER_DEATHS_SWIFTNESS']);
		// console.log(abilityKey == ABILITIES['GREATER_DEATHS_SWIFTNESS']);
		//TODO implement sunshine and other buffs
		if (abilityKey == ABILITIES['GREATER_DEATHS_SWIFTNESS']) {
			buffTimings['swiftness'].push([abilityBarIndex, abilityBarIndex+63]);
		}
		else if (abilityKey == ABILITIES['DEATHS_SWIFTNESS']) {
			buffTimings['swiftness'].push([abilityBarIndex, abilityBarIndex+52]);
		}
		else if (abilityKey == ABILITIES['SPLIT_SOUL_ECB']) {
			buffTimings['split soul ecb'].push([abilityBarIndex, abilityBarIndex+25]);
		}
		buffTimings = {...buffTimings};
		if (abils[abilityKey]['duration']) {
			abilityBarIndex += abils[abilityKey]['duration'];
		}
		else {
			abilityBarIndex += 3;
		}
    }

	function buffActive(key, index) {
		let active = false; 
		//Find which tick(s) this buff is used on, and if the current tick
		//is within the buff duration for any of the uses
		buffTimings[key].forEach(element => {
			if (index >= element[0] && index < element[1]) {
				active = true; // todo return early if possible
			}
		});
		let x = abilityBar[0] == null; //THIS IS REQUIRED TO FORCE THE ROTATION TO RERENDER
		//TODO rewrite this 
		return active
	}

    function handleDragStart(event, ability) {
        event.dataTransfer.setData('text/plain', ability);
		//TODO rethink drag - it kinda sucks compared to clicking to add
    }

    function handleDrop(event, index) {
        event.preventDefault();
        const abilityKey = event.dataTransfer.getData("text/plain");
		if (rangedAbils[abilityKey]) {
			abilityBar[index] = abilityKey;
		}
		//TODO rethink drag - it kinda sucks compared to clicking to add
    }

    function allowDrop(event) {
        event.preventDefault();
    }

	function clearRotation() {
		for (let i = 0; i < abilityBar.length; i++) {
			abilityBar[i] = null;
		}
		totalDamage = 0;
		abilityBarIndex = 0;
		//Reset the visual indicators for buffs
		for (let key in buffTimings) {
			if (buffTimings.hasOwnProperty(key)) {
				buffTimings[key] = []; // Reset each key to an empty array
			}
		}
	}
</script>

<Navbar />
<Header img="/range_background.png" text="Rotation Calculator" icon="/style_icons/ranged-white.svg" />

<div class="space-y-14 mt-10 z-20">
	<div class="responsive-container">
		<section class="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
			<div class="xl:col-span-6 xl:row-start-1 xl:row-span-4">
				<div class="card card-ranged">
					<h1 class="main-header mb-6 ml-3">Rotation</h1>
					<div class="table-container">
						<button on:click={clearRotation}>Reset</button>
						<br>
                        <button on:click={calculateTotalDamage2}>Calculate Damage</button>
                        <p>Total Damage: {totalDamage}</p>
					</div>
					
					<div class="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-x-0 gap-y-2 abilities">
                        {#each Object.entries(rangedAbils) as [key, ability]}
							<div
								role="button"
								tabindex="0"
								aria-label={ability.title}
								on:click={(e) => handleAbilityClick(e, key)}
								on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAbilityClick(e, key); }}
								style="display: inline-block;"
							>
								<img
									src={ability.icon}
									alt={ability.title}
									draggable="true"
									on:dragstart={(e) => handleDragStart(e, key)}
									title={ability.title}
									class="ability-icon"
									width="30"
									height="30"
									style="border: 1px solid #00bf63;"
								/>
							</div>
                        {/each}
                    </div>
                    <div class="ability-bar">
					
						{#each abilityBar as ability, index}
							<div class="ability-slot"
									role="option"
									tabindex="0"
									aria-label="Ability slot"
									aria-selected={ability ? 'true' : 'false'}
									on:drop={(e) => handleDrop(e, index)}
									on:dragover={allowDrop}
							>
								<span class="cell-number">{index}</span>
								{#if ability}
									<img src={rangedAbils[ability].icon} alt={rangedAbils[ability].title} style="width: 100%; height: 100%;" />
								{/if}
								{#if buffActive('swiftness', index)}
									<div class="line-swiftness"></div>
								{/if}
								{#if buffActive('split soul ecb', index)}
									<div class="line-ecb"></div>
								{/if}
								
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div class="xl:col-span-6 xl:row-start-1 xl:row-span-1 card card-ranged">
                <ul class="flex flex-wrap flex-col md:flex-row text-sm font-medium text-center">
                    <li class="flex-grow me-2">
                        <button
                            on:click={() => (tab = 'general')}
                            class:text-[#968A5C]={tab === 'general'}
                            class="text-[#C2BA9E] font-bold text-2xl text-link uppercase inline-block hover:text-[#968A5C]"
                            >General</button
                        >
                    </li>
                    <li class="flex-grow me-2">
                        <button
                            on:click={() => (tab = 'equipment')}
                            class:text-[#968A5C]={tab === 'equipment'}
                            class="text-[#C2BA9E] font-bold text-2xl text-link uppercase inline-block hover:text-[#968A5C]"
                            >Equipment</button
                        >
                    </li>
                    <li class="flex-grow me-2">
                        <button
                            on:click={() => (tab = 'bosses')}
                            class:text-[#968A5C]={tab === 'bosses'}
                            class="text-[#C2BA9E] font-bold text-2xl text-link uppercase inline-block hover:text-[#968A5C]"
                            >Bosses</button
                        >
                    </li>
                </ul>
                <form class="w-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                        {#if tab === 'general'}
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">General</h5>
                                <Select
                                    setting={settings[SETTINGS.MODE]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.BALANCE_BY_FORCE]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Number
                                    setting={settings[SETTINGS.PERFECT_EQUILIBRIUM_STACKS]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="7"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.TARGET_SIZE]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="5"
                                    min="0"
                                />
                                <Select
                                    setting={settings[SETTINGS.DRACOLICH_INFUSION]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Number
                                    setting={settings[SETTINGS.TARGET_HP_PERCENT]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="100"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">Base damage</h5>
                                <Number
                                    setting={settings[SETTINGS.ABILITY_DAMAGE]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="9999"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.RANGED_LEVEL]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="150"
                                    min="1"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.REAPER_CREW]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/death.png"
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">
                                    Invisible base damage
                                </h5>
                                <Number
                                    setting={settings[SETTINGS.HIT_CHANCE]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="100"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.ICY_PRECISION]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="15"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">
                                    Ability specific
                                </h5>
                                <Checkbox
                                    setting={settings[SETTINGS.WALKED_TARGET]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.NEEDLE_STRIKE]}
                                    on:settingsUpdated={updateDamages}
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">Additive</h5>
                                <Number
                                    setting={settings[SETTINGS.STONE_OF_JAS]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="6"
                                    min="0"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.DRACONIC_FRUIT]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Number
                                    setting={settings[SETTINGS.RUBY_AURORA]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Ruby_Aurora_icon.webp"
                                    step="1"
                                    max="3"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">
                                    Multiplicative (shared)
                                </h5>
                                <Select
                                    setting={settings[SETTINGS.RANGED_PRAYER]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Prayer.webp"
                                />
                                <Number
                                    setting={settings[SETTINGS.REVENGE]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="10"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">
                                    Multiplicative (PvE)
                                </h5>
                                <Select
                                    setting={settings[SETTINGS.SLAYER_HELM]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Select
                                    setting={settings[SETTINGS.GUARDHOUSE]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SWIFTNESS_OF_THE_AVIANSIE]}
                                    on:settingsUpdated={updateDamages}
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">Core</h5>
                                <Number
                                    setting={settings[SETTINGS.BERSERKERS_FURY]}
                                    on:settingsUpdated={updateDamages}
                                    step="0.5"
                                    max="5.5"
                                    min="0"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SMOKE_CLOUD]}
                                    on:settingsUpdated={updateDamages}
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">On-NPC</h5>
                                <Select
                                    setting={settings[SETTINGS.VULN]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Vulnerability_icon.webp"
                                />
                                <Select
                                    setting={settings[SETTINGS.ENDURING_RUIN_BLEED]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Number
                                    setting={settings[SETTINGS.INFERNAL_PUZZLE_BOX]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="6"
                                    min="0"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.CRYPTBLOOM]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Cryptbloom_helm.png"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SLAYER_PERK_UNDEAD]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/25px-Undead_Slayer.webp"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SLAYER_PERK_DRAGON]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/25px-Undead_Slayer.webp"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SLAYER_PERK_DEMON]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/25px-Undead_Slayer.webp"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SLAYER_SIGIL_UNDEAD]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Undead_slayer_sigil_detail.png"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SLAYER_SIGIL_DRAGON]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Undead_slayer_sigil_detail.png"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.SLAYER_SIGIL_DEMON]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Undead_slayer_sigil_detail.png"
                                />
                                <Number
                                    setting={settings[SETTINGS.NOPE]}
                                    on:settingsUpdated={updateDamages}
                                    step="1"
                                    max="3"
                                    min="0"
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.HAUNTED]}
                                    on:settingsUpdated={updateDamages}
                                    img="https://imgur.com/9U5ghz2.png"
                                />
                                <Number
                                    setting={settings[SETTINGS.HAUNTED_AD]}
                                    on:settingsUpdated={updateDamages}
                                />
                            </div>
                        {:else if tab === 'equipment'}
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">Armour</h5>
                                <Select
                                    setting={settings[SETTINGS.RANGED_HELMET]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Head_slot.webp"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_BODY]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Torso_slot.png"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_LEGS]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Legs_slot.png"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_GLOVES]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Hands_slot.webp"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_BOOTS]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Feet_slot.png"
                                />
                                <Select
                                    setting={settings[SETTINGS.NECKLACE]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Neck_slot.png"
                                />
                                <Select
                                    setting={settings[SETTINGS.CAPE]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Back_slot.png"
                                />
                                <Select
                                    setting={settings[SETTINGS.RING]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Ring_slot.png"
                                />
                                <Select
                                    setting={settings[SETTINGS.POCKET]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Pocket_slot.webp"
                                />
                                <Select
                                    setting={settings[SETTINGS.AURA]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Select
                                    setting={settings[SETTINGS.FAMILIAR]}
                                    on:settingsUpdated={updateDamages}
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">Perks</h5>
                                <Checkbox
                                    setting={settings[SETTINGS.LVL20ARMOUR]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/level-20.png"
                                />
                                <Number
                                    setting={settings[SETTINGS.BITING]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Biting.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.PRECISE]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Precise.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.ERUPTIVE]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Eruptive.webp"
                                    max="4"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.CAROMING]}
                                    on:settingsUpdated={updateDamages}
                                    max="4"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.FLANKING]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Flanking.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.GENOCIDAL]}
                                    on:settingsUpdated={updateDamages}
                                    max="4.9"
                                    step="0.1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.RUTHLESS_RANK]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Ruthless.webp"
                                    max="3"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    setting={settings[SETTINGS.RUTHLESS_STACKS]}
                                    on:settingsUpdated={updateDamages}
                                    img="/effect_icons/Ruthless.webp"
                                    max="5"
                                    step="1"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1">
                                <h5 class="uppercase font-bold text-lg text-center">Weapons</h5>
                                <Select
                                    setting={settings[SETTINGS.WEAPON]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Main_hand_slot.webp"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_MH]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Main_hand_slot.webp"
                                />
                                <Number
                                    setting={settings[SETTINGS.MH_TIER_CUSTOM]}
                                    on:settingsUpdated={updateDamages}
                                    max="100"
                                    step="1"
                                    min="0"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_OH]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Off-hand_slot.webp"
                                />
                                <Number
                                    setting={settings[SETTINGS.OH_TIER_CUSTOM]}
                                    on:settingsUpdated={updateDamages}
                                    max="100"
                                    step="1"
                                    min="0"
                                />
                                <Select
                                    setting={settings[SETTINGS.RANGED_TH]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Off-hand_slot.webp"
                                />
                                <Number
                                    setting={settings[SETTINGS.TH_TIER_CUSTOM]}
                                    on:settingsUpdated={updateDamages}
                                    max="100"
                                    step="1"
                                    min="0"
                                />
                                <Select
                                    setting={settings[SETTINGS.TH_TYPE_CUSTOM]}
                                    on:settingsUpdated={updateDamages}
                                    img="/armour_icons/Off-hand_slot.webp"
                                />
                                <Select
                                    setting={settings[SETTINGS.AMMO]}
                                    on:settingsUpdated={updateDamages}
                                />
                                <Checkbox
                                    setting={settings[SETTINGS.INNATE_MASTERY]}
                                    on:settingsUpdated={updateDamages}
                                />
                            </div>
                        {:else if tab === 'bosses'}
                        <div class="md:col-span-1">
                            <Number
                                setting={settings[SETTINGS.GUARDIANS_TRIUMPH]}
                                on:settingsUpdated={updateDamages}
                                img="/effect_icons/Guardian's_Triumph_Edict_(self_status).png"
                                step="1"
                                min="0"
                            />
                        </div>
                        {/if}
                    </div>
                </form>
            </div>
		</section>
	</div>
</div>

<style>
	/* TODO - move these into their own css file */
	.ability-bar {
		display: grid; 
		grid-template-columns: repeat(auto-fill, 30px); 
		row-gap: 30px; 
		column-gap: 0px; 
		position: relative;
	}

	.ability-slot {
        position: relative;
		width: 30px; 
		height: 30px; 
		display: flex; 
		justify-content: center; 
		align-items: center; 
		position: relative; 
		border: 1px solid #878787; 
		box-sizing: border-box;
    }

	.line-swiftness {
		position: absolute;
		bottom: -6px;
		left: -1px;
		width: 32px;
		height: 4px;
		background-color: #00bf63; /* Dashed line color */
		box-sizing: border-box;
	}

	.line-ecb {
		position: absolute;
		bottom: -11px;
		left: -1px;
		width: 32px;
		height: 4px;
		background-color: #9303ec; /* Dashed line color */
	}

	.ability-bar {
		padding-top: 25px;
	}

    .cell-number {
        position: absolute;
        top: -18px; /* Adjust to move the number above the cell */
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px; /* Adjust size of the number */
        color: #a8a8a8; /* Adjust color of the number */
	}
</style>

