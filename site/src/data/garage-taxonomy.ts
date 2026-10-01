// Class and manufacturer landing pages of The Garage (RS-0050, DEC-0087,
// supersedes DEC-0059). Pages: /garage/classes/<slug>/ and
// /garage/manufacturers/<slug>/.
//
// COPY STATUS per page: 'approved' = Codex copy approved by Fausto
// (Freigegebene Website-Texte, 2026-10-01). 'draft-claude' = Claude
// placeholder still live because the approved Codex version names vehicles
// that are not officially revealed (Fausto, 2026-10-01; see
// Claude outputs/CODEX-KORREKTUR-Taxonomie-Texte-2026-10-01.md).
import { vehicleOptions, type VehicleOption } from './vehicles';

export interface TaxonomyPage { slug: string; name: string; intro: string[]; copyStatus: 'draft-claude' | 'approved' }

export const classPages: TaxonomyPage[] = [
  { slug: 'super', name: 'Super', copyStatus: 'approved', intro: [
    'GTA VI Super cars bring together the wildest shapes in The Garage, from Ferrari- and Lamborghini-inspired exotics to Bugatti-style hypercars. If a car looks fast while parked, it probably ended up here. Open any model to check its specs, release details, first appearance, and real-life inspiration.',
  ] },
  { slug: 'sports', name: 'Sports', copyStatus: 'approved', intro: [
    'The GTA VI Sports class covers nearly every kind of driver’s car: Japanese tuners, German coupes, electric grand tourers, American roadsters, and plenty in between. It is where cars inspired by the Dodge Viper, Toyota AE86, Nissan Skyline GT-R, and Porsche 911 share the same grid.',
  ] },
  { slug: 'muscle', name: 'Muscle', copyStatus: 'approved', intro: [
    'GTA VI Muscle cars bring big American engines and bold shapes to The Garage, from classic pony cars and lowriders to modern Mustang-, Challenger-, and Camaro-inspired builds. The lineup runs from the Buccaneer and Sabre Turbo to the Gauntlet Hellfire and the many faces of the Dominator. Some are clean, some are loud, and subtlety is rarely the point.',
  ] },
  { slug: 'sports-classics', name: 'Sports Classics', copyStatus: 'draft-claude', intro: [
    'Sports Classics collects the icons of past decades: Testarossa-style wedges, 1960s racing coupes and 1980s German sports sedans. These are the cars you bring to a meet as much as to a race.',
  ] },
  { slug: 'coupes', name: 'Coupes', copyStatus: 'approved', intro: [
    'GTA VI Coupes sit between sports cars and grand tourers, with two-door designs inspired by the BMW M3 and M6, Infiniti G35, and Rolls-Royce Wraith. That means everything from the Sentinel XS and FR36 to the Zion Cabrio and Windsor. The right pick depends on whether you want a back road, a boulevard, or both.',
  ] },
  { slug: 'sedans', name: 'Sedans', copyStatus: 'approved', intro: [
    'GTA VI Sedans range from ordinary-looking four-doors and wagons to full-size American classics and serious sports sedans. The roster stretches from the Stanier and Emperor to the Feroci, Tailgater, and Schafter V12. Crown Victoria, Lexus GS, Audi, and Cadillac influences make this class far less anonymous than the body style suggests.',
  ] },
  { slug: 'suvs', name: 'SUVs', copyStatus: 'approved', intro: [
    'GTA VI SUVs run from city crossovers to full-size luxury trucks and old-school utility rigs. The Baller, Dubsta, Toros, and Granger families cover very different ideas of what an SUV should be. Range Rover, Mercedes-Benz G-Class, Lamborghini Urus, Ford, and Jeep influences give the class plenty of ways to take up more than its share of the road.',
  ] },
  { slug: 'off-road', name: 'Off-Road', copyStatus: 'approved', intro: [
    'GTA VI Off-Road vehicles bring together lifted trucks, 4x4s, and trail builds inspired by the Ford F-150 Raptor, Toyota Hilux, Hummer H1, and Jeep concepts. From the Caracara 4x4 and Rebel to the Patriot Mil-Spec and Kamacho, the class covers several ways to leave the city behind. When the pavement ends, this is the part of The Garage you start with.',
  ] },
];

export const manufacturerPages: TaxonomyPage[] = [
  { slug: 'vapid', name: 'Vapid', copyStatus: 'approved', intro: ['Vapid brings Ford-inspired car culture into GTA VI, led by generations of Dominators alongside pickups, SUVs, and the Stanier sedans. That puts the Dominator, Stanier, Caracara, Aleutian, and Riata families under one badge. From old-school muscle to lifted builds, the Ford influence is hard to miss.'] },
  { slug: 'declasse', name: 'Declasse', copyStatus: 'draft-claude', intro: ['Declasse mirrors Chevrolet: Impala- and Chevelle-inspired muscle, Suburban-style Granger SUVs and classics like the Tornado and Mamba GT.'] },
  { slug: 'albany', name: 'Albany', copyStatus: 'approved', intro: ['Albany puts American luxury into GTA VI, drawing mainly from Cadillac and Buick. Its lineup moves from the Emperor and Manana classics to the Cavalcade XL and V-STR, covering several decades without losing that unmistakable big-car presence. From boulevard cruisers to full-size SUVs and sports sedans, Albany rarely does understated.'] },
  { slug: 'karin', name: 'Karin', copyStatus: 'approved', intro: ['Karin brings a wide slice of Japanese car culture to GTA VI, from everyday sedans and pickups to the Futo and Sultan. Toyota is the clearest influence, while Subaru, Lexus, and other Japanese cues appear across individual models. Daily drivers, tuner favorites, rally-bred shapes, and practical trucks all share the same badge.'] },
  { slug: 'bravado', name: 'Bravado', copyStatus: 'approved', intro: ['Bravado brings Dodge-inspired American performance to GTA VI, from the Viper-shaped Banshee and Charger-based Buffalo family to the Challenger-inspired Gauntlets and Durango-style Dorado. Sports cars, muscle cars, sedans, and SUVs all wear the same badge, usually with more aggression than restraint.'] },
  { slug: 'ubermacht', name: 'Übermacht', copyStatus: 'approved', intro: ['BMW influence runs through every generation of Übermacht represented in GTA VI. The Cypher draws from the M2, the Sentinel XS from the M3, and the Zion from the 6 Series, while the Sentinel Classic brings the E30 era into The Garage. That gives BMW fans coupes, cabrios, modern tuner builds, and 1980s classics to choose from.'] },
  { slug: 'pfister', name: 'Pfister', copyStatus: 'approved', intro: ['Pfister’s GTA VI range carries Porsche design across different eras and body styles. The Comet Retro Custom looks back to air-cooled 911s, while the Comet S2 Cabrio brings modern 911 influence into an open-top shape. Elsewhere, the Growler draws from the 718 Cayman, the electric Neon reflects the Mission E and Taycan, and the Astron takes after the Macan. The family resemblance is rarely hard to spot.'] },
  { slug: 'grotti', name: 'Grotti', copyStatus: 'approved', intro: ['Grotti covers several eras of exotic design in GTA VI. The Cheetah ’95 brings classic Ferrari influence, the Carbonizzare adds a front-engined grand tourer, and the SF90-inspired Itali RSX joins the Furia at the modern supercar end of the lineup. Different shapes, different decades, and no real interest in blending into traffic.'] },
  { slug: 'obey', name: 'Obey', copyStatus: 'approved', intro: ['Obey applies Audi’s clean German design language across its GTA VI range. Models such as the Tailgater and Tailgater S cover executive and compact sports sedans, while the 8F Drafter draws from the RS5 coupe and the Omnis e-GT brings e-tron GT influence. From everyday four-doors to electric grand tourers, the four-ring inspiration is easy to spot.'] },
  { slug: 'pegassi', name: 'Pegassi', copyStatus: 'approved', intro: ['Pegassi puts Lamborghini-style drama at the center of its GTA VI range. Models such as the Huracán-inspired Tempesta, Urus-based Toros, and Diablo-shaped Infernus Classic cover very different sides of the badge, while the open-top Zorrusso adds another modern exotic shape. Across supercars, classics, and SUVs, sharp angles and very little restraint remain familiar themes.'] },
  { slug: 'dundreary', name: 'Dundreary', copyStatus: 'draft-claude', intro: ['Dundreary builds big American cars with a Lincoln and Mercury feel, from the Landstalker XL SUV to the Sirius muscle car.'] },
  { slug: 'imponte', name: 'Imponte', copyStatus: 'draft-claude', intro: ['Imponte is the GTA universe’s Pontiac, known for the Firebird-inspired Phoenix and Ruiner.'] },
  { slug: 'benefactor', name: 'Benefactor', copyStatus: 'approved', intro: ['Benefactor translates Mercedes-Benz design into GTA VI across luxury SUVs and executive sedans. Models such as the G-Class-shaped Dubsta and GL-Class-inspired XLS cover different takes on the SUV, while the Schafter V12 moves an S-Class sedan toward AMG and Brabus territory. Whatever the body style, the three-pointed-star influence is clear.'] },
  { slug: 'canis', name: 'Canis', copyStatus: 'approved', intro: ['Canis keeps Jeep-inspired 4x4 design at the center of its GTA VI range. Models such as the Wrangler-shaped Mesa, Cherokee XJ-inspired Seminole Frontier, and Crew Chief 715-based Kamacho cover several takes on the classic off-road formula. Upright bodies and trail-ready proportions make the Canis badge easy to recognize, even before the pavement ends.'] },
];

export const classSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const classSet = new Set(classPages.map((c) => c.slug));
const makeSet = new Set(manufacturerPages.map((m) => m.slug));
export const classHref = (name: string) => (classSet.has(classSlug(name)) ? `garage/classes/${classSlug(name)}/` : null);
export const makeHref = (v: Pick<VehicleOption, 'logoSlug'>) => (makeSet.has(v.logoSlug) ? `garage/manufacturers/${v.logoSlug}/` : null);
export const vehiclesInClass = (slug: string) => vehicleOptions.filter((v) => v.classes.some((c) => classSlug(c) === slug));
export const vehiclesByMake = (slug: string) => vehicleOptions.filter((v) => v.logoSlug === slug);
