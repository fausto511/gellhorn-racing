// Class and manufacturer landing pages of The Garage (RS-0050, DEC-0087,
// supersedes DEC-0059). Pages: /garage/classes/<slug>/ and
// /garage/manufacturers/<slug>/.
//
// COPY STATUS: every `intro` below is a PLACEHOLDER drafted by Claude
// (2026-10-01) and must be reviewed/rewritten by Codex before it counts as
// approved copy (Fausto: all site copy comes from Codex). Facts in the drafts
// only use what the site data already states (classes, real-life inspirations).
import { vehicleOptions, type VehicleOption } from './vehicles';

export interface TaxonomyPage { slug: string; name: string; intro: string[]; copyStatus: 'draft-claude' | 'approved' }

export const classPages: TaxonomyPage[] = [
  { slug: 'super', name: 'Super', copyStatus: 'draft-claude', intro: [
    'Super cars are the top of the GTA VI performance ladder: mid-engine exotics built for outright pace. The class takes its cues from modern hypercars such as the Pininfarina Battista and Lamborghini Huracán.',
  ] },
  { slug: 'sports', name: 'Sports', copyStatus: 'draft-claude', intro: [
    'Sports is the widest class in GTA VI, from Japanese tuner icons to German coupes and electric grand tourers. Expect everything from Porsche- and BMW-inspired track tools to cars modeled on the Dodge Viper and Toyota AE86.',
  ] },
  { slug: 'muscle', name: 'Muscle', copyStatus: 'draft-claude', intro: [
    'Muscle cars bring big American engines and bold proportions to GTA VI. The class spans classic pony cars and modern Mustang, Challenger and Camaro-inspired models, plus a few lowriders and pickups with muscle-car attitude.',
  ] },
  { slug: 'sports-classics', name: 'Sports Classics', copyStatus: 'draft-claude', intro: [
    'Sports Classics collects the icons of past decades: Testarossa-style wedges, 1960s racing coupes and 1980s German sports sedans. These are the cars you bring to a meet as much as to a race.',
  ] },
  { slug: 'coupes', name: 'Coupes', copyStatus: 'draft-claude', intro: [
    'Coupes in GTA VI are two-door grand tourers and sporty luxury cars, with designs drawn from BMW M coupes, the Infiniti G35 and the Rolls-Royce Wraith.',
  ] },
  { slug: 'sedans', name: 'Sedans', copyStatus: 'draft-claude', intro: [
    'Sedans cover the everyday cars of Leonida: family four-doors, wagons and full-size American classics, from Crown Victoria-style cruisers to Japanese and German executive cars.',
  ] },
  { slug: 'suvs', name: 'SUVs', copyStatus: 'draft-claude', intro: [
    'SUVs in GTA VI range from compact crossovers to full-size luxury trucks, with designs inspired by the Range Rover, Mercedes-Benz G-Class, Lamborghini Urus and classic Ford and Jeep off-roaders.',
  ] },
  { slug: 'off-road', name: 'Off-Road', copyStatus: 'draft-claude', intro: [
    'Off-Road vehicles are built for dirt, sand and the swamps of Leonida: lifted pickups, 4x4s and trail builds inspired by the Ford F-150 Raptor, Toyota Hilux and Hummer H1.',
  ] },
];

export const manufacturerPages: TaxonomyPage[] = [
  { slug: 'vapid', name: 'Vapid', copyStatus: 'draft-claude', intro: ['Vapid is the GTA universe’s take on Ford. In GTA VI its lineup reaches from the Dominator family, modeled on several Mustang generations, to pickups, SUVs and the classic Stanier sedans.'] },
  { slug: 'declasse', name: 'Declasse', copyStatus: 'draft-claude', intro: ['Declasse mirrors Chevrolet: Impala- and Chevelle-inspired muscle, Suburban-style Granger SUVs and classics like the Tornado and Mamba GT.'] },
  { slug: 'albany', name: 'Albany', copyStatus: 'draft-claude', intro: ['Albany is the GTA universe’s American luxury brand, with most models drawn from Cadillac, from the Emperor sedan to the Cavalcade XL SUV and the V-STR sports sedan.'] },
  { slug: 'karin', name: 'Karin', copyStatus: 'draft-claude', intro: ['Karin stands in for Toyota and Lexus: everyday sedans, pickups and the Futo and Sultan, two cars with strong Japanese tuner roots.'] },
  { slug: 'bravado', name: 'Bravado', copyStatus: 'draft-claude', intro: ['Bravado is modeled on Dodge. In GTA VI that means the Viper-inspired Banshee, the Buffalo sedans and the Gauntlet muscle cars based on the Challenger.'] },
  { slug: 'ubermacht', name: 'Übermacht', copyStatus: 'draft-claude', intro: ['Übermacht is the GTA universe’s BMW. Its GTA VI lineup covers M2- and M3-inspired sports cars, the Zion coupes and the E30-based Sentinel Classic.'] },
  { slug: 'pfister', name: 'Pfister', copyStatus: 'draft-claude', intro: ['Pfister is the GTA universe’s Porsche, from Comet 911-style sports cars to the Growler, the electric Neon and the Astron SUV.'] },
  { slug: 'grotti', name: 'Grotti', copyStatus: 'draft-claude', intro: ['Grotti is the Italian exotic brand of GTA VI, with Ferrari-inspired models like the Cheetah ’95 and Itali RSX alongside the Furia hypercar.'] },
  { slug: 'obey', name: 'Obey', copyStatus: 'draft-claude', intro: ['Obey mirrors Audi: the Tailgater sedans, the 8F Drafter coupe and the electric Omnis e-GT.'] },
  { slug: 'pegassi', name: 'Pegassi', copyStatus: 'draft-claude', intro: ['Pegassi is the GTA universe’s Lamborghini, with the Tempesta and Zorrusso super cars, the Toros SUV and the Diablo-inspired Infernus Classic.'] },
  { slug: 'dundreary', name: 'Dundreary', copyStatus: 'draft-claude', intro: ['Dundreary builds big American cars with a Lincoln and Mercury feel, from the Landstalker XL SUV to the Sirius muscle car.'] },
  { slug: 'imponte', name: 'Imponte', copyStatus: 'draft-claude', intro: ['Imponte is the GTA universe’s Pontiac, known for the Firebird-inspired Phoenix and Ruiner.'] },
  { slug: 'benefactor', name: 'Benefactor', copyStatus: 'draft-claude', intro: ['Benefactor mirrors Mercedes-Benz: the G-Class-style Dubsta, the XLS SUV and the Brabus-inspired Schafter V12.'] },
  { slug: 'canis', name: 'Canis', copyStatus: 'draft-claude', intro: ['Canis is the GTA universe’s Jeep, with the Mesa, the Seminole Frontier and the military-style Kamacho.'] },
];

export const classSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const classSet = new Set(classPages.map((c) => c.slug));
const makeSet = new Set(manufacturerPages.map((m) => m.slug));
export const classHref = (name: string) => (classSet.has(classSlug(name)) ? `garage/classes/${classSlug(name)}/` : null);
export const makeHref = (v: Pick<VehicleOption, 'logoSlug'>) => (makeSet.has(v.logoSlug) ? `garage/manufacturers/${v.logoSlug}/` : null);
export const vehiclesInClass = (slug: string) => vehicleOptions.filter((v) => v.classes.some((c) => classSlug(c) === slug));
export const vehiclesByMake = (slug: string) => vehicleOptions.filter((v) => v.logoSlug === slug);
