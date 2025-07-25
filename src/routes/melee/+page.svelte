<script>
    import { renderComponent } from '@tanstack/svelte-table';

    import { SETTINGS, settingsConfig } from '$lib/calc/settings';
    import { abilities } from '$lib/melee/abilities';

    import AbilityDamageTable from '$components/AbilityDamageTable/AbilityDamageTable.svelte';
    import AbilityInfo from '$components/AbilityInfo/AbilityInfo.svelte';
    import Checkbox from '$components/Settings/Checkbox.svelte';
    import Header from '$components/Layout/Header.svelte';
    import Navbar from '$components/Layout/Navbar.svelte';
    import Number from '$components/Settings/Number.svelte';
    import Select from '$components/Settings/Select.svelte';

    let tab = $state('general');

    let damages = $state(Object.entries(abilities).map(([key, value]) => ({
        key,
        ...value,
        abilityInfo: {
            title: value.title,
            src: value.icon
        },
        regular: 0,
        zgs: 0,
        berserk: 0
    })));

    let storedSettings = {};
    if (typeof localStorage !== 'undefined') {
        storedSettings = JSON.parse(localStorage.getItem('settings')) || {};
    }

    let settings = $state(
        Object.fromEntries(
            Object.entries(settingsConfig).map(([key, value]) => [
                key,
                {
                    ...value,
                    key,
                    value: storedSettings[key]?.value ?? value.default?.melee ?? value.default
                }
            ])
        )
    );

    function saveSettings() {
        if (typeof localStorage !== 'undefined') {
            const settingsToSave = Object.fromEntries(
                Object.entries(settings).map(([key, value]) => [key, { value: value.value }])
            );
            localStorage.setItem('settings', JSON.stringify(settingsToSave));
        }
    }

    $effect(() => {
        if (settings) saveSettings();
    });

    const updateDamages = () => {
        const adaptedSettings = Object.fromEntries(
            Object.entries(settings).map(([key, value]) => [key, value.value])
        );

        damages = damages.map(ability => {
            adaptedSettings['ability'] = ability.key;

            ability.regular = ability.calc({ ...adaptedSettings, zgs: false, berserk: false });
            ability.zgs = ability.calc({ ...adaptedSettings, zgs: true, berserk: false });
            ability.berserk = ability.calc({ ...adaptedSettings, zgs: false, berserk: true });

            return ability;
        })
    }

    updateDamages()

    const sortAbilities = (rowA, rowB) => {
        const nameA = rowA.original.abilityInfo.title;
        const nameB = rowB.original.abilityInfo.title;
        return nameA.localeCompare(nameB);
    }

    const columns = [
        {
            accessorKey: 'abilityInfo',
            header: 'Ability',
            cell: ({ cell }) => renderComponent(AbilityInfo, { abilityInfo: cell.getValue() }),
            sortingFn: sortAbilities,
            sortDescFirst: false,
        },
        {
            accessorKey: 'regular',
            header: 'Regular',
            sortDescFirst: true,
            meta: {
                class: "text-center"
            }
        },
        {
            accessorKey: 'zgs',
            header: 'ZGS',
            sortDescFirst: true,
            meta: {
                class: "text-center"
            }
        },
        {
            accessorKey: 'berserk',
            header: 'Berserk',
            sortDescFirst: true,
            meta: {
                class: "text-center"
            }
        }
    ];
</script>

<Navbar />
<Header img="/melee-background.png" text="Melee Calculator" icon="/style_icons/melee-white.svg" />

<div class="space-y-14 mt-10 z-20">
    <div class="responsive-container">
        <section class="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
            <div class="xl:col-span-6 xl:row-start-1 xl:row-span-4">
                <div class="card card-melee">
                    <h1 class="main-header mb-6 ml-3">Damage Values</h1>
                    <div class="table-container">
                        <AbilityDamageTable data={damages} columns={columns} />
                    </div>
                </div>
            </div>

            <div class="xl:col-span-6 xl:row-start-1 xl:row-span-1 card card-melee">
                <ul class="flex flex-wrap flex-col md:flex-row text-sm font-medium text-center">
                    <li class="flex-grow me-2">
                        <button
                            onclick={() => (tab = 'general')}
                            class:text-[#968A5C]={tab === 'general'}
                            class="text-[#C2BA9E] font-bold text-2xl text-link uppercase inline-block hover:text-[#968A5C]"
                        >
                            General
                        </button>
                    </li>
                    <li class="flex-grow me-2">
                        <button
                            onclick={() => (tab = 'equipment')}
                            class:text-[#968A5C]={tab === 'equipment'}
                            class="text-[#C2BA9E] font-bold text-2xl text-link uppercase inline-block hover:text-[#968A5C]"
                        >
                            Equipment
                        </button>
                    </li>
                    <li class="flex-grow me-2">
                        <button
                            onclick={() => (tab = 'bosses')}
                            class:text-[#968A5C]={tab === 'bosses'}
                            class="text-[#C2BA9E] font-bold text-2xl text-link uppercase inline-block hover:text-[#968A5C]"
                        >
                            Bosses
                        </button>
                    </li>
                </ul>
                <form class="w-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                        {#if tab === 'general'}
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">General</h5>
                                <Select
                                    bind:setting={settings[SETTINGS.AUTO_HAND]}
                                    onchange={() => updateDamages()}
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MODE]}
                                    onchange={() => updateDamages()}
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.FLAMEBOUND_RIVAL]}
                                    onchange={() => updateDamages()}
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.NUMBER_OF_BLEEDS]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/number_of_bleeds.png"
                                    step="1"
                                    max="10"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.TARGET_HP_PERCENT]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/target_hp.png"
                                    step="1"
                                    max="100"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.STRENGTH_CAPE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/strength_cape.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.TARGET_DISABILITY]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/stunned.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.ABILITY_DAMAGE]}
                                    onchange={() => updateDamages()}
                                    step="1"
                                    max="9999"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.STRENGTH_LEVEL]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/strength.png"
                                    step="1"
                                    max="150"
                                    min="1"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.REAPER_CREW]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/death.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.HIT_CHANCE]}
                                    onchange={() => updateDamages()}
                                    step="1"
                                    max="100"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.HITCAP]}
                                    onchange={() => updateDamages()}
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.MAX_CHANNEL_DURATION]}
                                    onchange={() => updateDamages()}
                                    step="1"
                                    max="1000"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">
                                    Applies to dots
                                </h5>
                                <Checkbox
                                    bind:setting={settings[SETTINGS.CHAOS_ROAR]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/chaos_roar.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.VULN]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Vulnerability_icon.webp"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.ENDURING_RUIN_BLEED]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/enduring_ruin.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.INFERNAL_PUZZLE_BOX]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/infernal_puzzlebox.png"
                                    step="1"
                                    max="6"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.CRYPTBLOOM]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Cryptbloom_helm.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.SLAYER_PERK]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/25px-Undead_Slayer.webp"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.SLAYER_SIGIL]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Undead_slayer_sigil_detail.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.NOPE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/nopenopenope.png"
                                    step="1"
                                    max="3"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.HAUNTED]}
                                    onchange={() => updateDamages()}
                                    img="https://imgur.com/9U5ghz2.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.HAUNTED_AD]}
                                    onchange={() => updateDamages()}
                                />
                            </div>
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">
                                    Applies to regular abilities only
                                </h5>
                                <Select
                                    bind:setting={settings[SETTINGS.ENDURING_RUIN_HIT]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/enduring_ruin.png"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.WALKED_TARGET]}
                                    onchange={() => updateDamages()}
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.FURY_BUFF]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/greater_fury.png"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.RAMPAGE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/rampage.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.PRIMORDIAL_ICE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/primordial_ice.png"
                                    step="1"
                                    max="10"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.IGNEOUS_EXTENSIOS]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/igneous_extensions.png"
                                    step="1"
                                    max="5"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.TIME_SINCE_ATTACK]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/cease.png"
                                    step="1"
                                    max="10"
                                    min="0"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.POF_DINOS]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/no_fear.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.STONE_OF_JAS]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/stone_of_jas.png"
                                    step="1"
                                    max="6"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.DRACONIC_FRUIT]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/draconic_fruit.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.RUBY_AURORA]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Ruby_Aurora_icon.webp"
                                    step="1"
                                    max="3"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.GRAVITATE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/gravitate.png"
                                    step="1"
                                    max="20"
                                    min="0"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_PRAYER]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Prayer.webp"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.DIVINE_RAGE]}
                                    onchange={() => updateDamages()}
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.ECLIPSED_SOUL]}
                                    onchange={() => updateDamages()}
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.REVENGE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/revenge.png"
                                    step="1"
                                    max="10"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">Part 2</h5>
                                <Select
                                    bind:setting={settings[SETTINGS.SLAYER_HELM]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/slayer_helmet.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.GUARDHOUSE]}
                                    onchange={() => updateDamages()}
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.SWIFTNESS_OF_THE_AVIANSIE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/swiftness_of_the_avianse.png"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.FROSTBLADES]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/frostblades.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.BERSERKERS_FURY]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/berserkers_fury.png"
                                    step="0.5"
                                    max="5.5"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.SMOKE_CLOUD]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/smoke_cloud.png"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.KALG_SPEC]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/crit_i_kal.png"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.TELOS_RED_BEAM]}
                                    onchange={() => updateDamages()}
                                    img="effect_icons/Red_virus.png"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.TELOS_BLACK_BEAM]}
                                    onchange={() => updateDamages()}
                                    img="effect_icons/Black_virus.png"
                                />
                            </div>
                        {:else if tab === 'equipment'}
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">Armour</h5>
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_HELMET]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Head_slot.webp"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_BODY]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Torso_slot.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_LEGS]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Legs_slot.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_GLOVES]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Hands_slot.webp"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_BOOTS]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Feet_slot.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.NECKLACE]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Neck_slot.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.CAPE]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Back_slot.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.RING]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Ring_slot.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.POCKET]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Pocket_slot.webp"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.AURA]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/aura.png"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.FAMILIAR]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/familiar.png"
                                />
                            </div>
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">Perks</h5>
                                <Checkbox
                                    bind:setting={settings[SETTINGS.LVL20ARMOUR]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/level-20.png"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.BITING]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Biting.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.PRECISE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Precise.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.ERUPTIVE]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Eruptive.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.FLANKING]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Flanking.webp"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.LUNGING]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Lunging.webp"
                                    step="1"
                                    min="0"
                                    max="4"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.GENOCIDAL]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/genocidal.png"
                                    max="4.9"
                                    step="0.1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.RUTHLESS_RANK]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Ruthless.webp"
                                    max="3"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.RUTHLESS_STACKS]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Ruthless.webp"
                                    max="5"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.ENERGISING]}
                                    onchange={() => updateDamages()}
                                    max="4"
                                    step="1"
                                    min="0"
                                />
                            </div>
                            <div class="md:col-span-1 space-y-2">
                                <h5 class="uppercase font-bold text-lg text-center">Weapons</h5>
                                <Select
                                    bind:setting={settings[SETTINGS.WEAPON_TYPE_MELEE]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Main_hand_slot.webp"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_MH]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Main_hand_slot.webp"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.MH_TIER_CUSTOM]}
                                    onchange={() => updateDamages()}
                                    max="100"
                                    step="1"
                                    min="0"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_OH]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Off-hand_slot.webp"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.OH_TIER_CUSTOM]}
                                    onchange={() => updateDamages()}
                                    max="100"
                                    step="1"
                                    min="0"
                                />
                                <Select
                                    bind:setting={settings[SETTINGS.MELEE_TH]}
                                    onchange={() => updateDamages()}
                                    img="/armour_icons/Off-hand_slot.webp"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.TH_TIER_CUSTOM]}
                                    onchange={() => updateDamages()}
                                    max="100"
                                    step="1"
                                    min="0"
                                />
                                <Checkbox
                                    bind:setting={settings[SETTINGS.INNATE_MASTERY]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/shard_of_genesis.png"
                                />
                            </div>
                        {:else if tab === 'bosses'}
                            <div class="md:col-span-1 space-y-2">
                                <Number
                                    bind:setting={settings[SETTINGS.GUARDIANS_TRIUMPH]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Guardian's_Triumph_Edict_(self_status).png"
                                    step="1"
                                    min="0"
                                />
                                <Number
                                    bind:setting={settings[SETTINGS.BALANCE_OF_POWER]}
                                    onchange={() => updateDamages()}
                                    img="/effect_icons/Balance_of_Power_Edict_(self_status).png"
                                    step="1"
                                    min="0"
                                    max="6"
                                />
                            </div>
                        {/if}
                    </div>
                </form>
            </div>

            <div class="xl:col-span-6 xl:row-start-2 xl:col-start-7">
                <div class="flex flex-col">
                    <div class="card card-melee">
                        <div class="card-title pb-5">User Guide</div>
                        <div class="pb-5">
                            <p>
                                Ability damage is automatically calculated based on the settings you
                                have selected, however, you can manually override it by entering a
                                value other than zero in the setting field.
                            </p>
                        </div>
                        <div class="pb-5">
                            <p>
                                The calculator prevents irrational settings from being selected, for
                                example, revenge does nothing if you do not have mainhand + shield
                                (Ms) as your selected weapon. Be sure to check all settings if
                                effects are not giving the expected results.
                            </p>
                        </div>
                        <div>
                            <p>
                                Certain value or stack based effects have higher bounds than what
                                exists in the live game which we have done to allow for more freedom
                                with testing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</div>
