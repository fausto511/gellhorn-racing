// The Guide (/guide/), sourced overview of GTA VI cars, driving, ownership,
// customization, racing and car culture.
// COPY STATUS: Codex 2026-10-02 (Codex Zuarbeit/The-Guide-Website-Texte-und-Quellen-2026-10-02.md),
// approved by Fausto 2026-10-03 with Claude's corrections:
// Dazed staging link replaced with the public URL; "The Lab" line and the
// "See All Confirmed Mod Shops" CTA removed (no target page yet).
// PENDING (Codex): one consistent set of evidence labels (sections vs.
// methodology) and the ownership/garage section (Kotaku demo report).
// Never add leak information here. Visible text: "GTA VI"; meta: "GTA 6".

/** Date shown as "Last updated" and used as dateModified. Change on every content update. */
export const GUIDE_UPDATED = '2026-10-03';
export const GUIDE_PUBLISHED = '2026-10-03';

export interface GuideSource { label: string; url: string; note: string }
export interface GuideSection {
  id: string;
  title: string;
  status?: string;
  paragraphs: string[]; // trusted HTML (only <strong>)
  cta?: { label: string; href: string };
  sourcesHeading?: string;
  sources: GuideSource[];
}

const R_MEDIA = 'https://www.rockstargames.com/VI/media';
const R_SHOTS = 'https://www.rockstargames.com/VI/media/screenshots';
const R_EDITIONS = 'https://www.rockstargames.com/VI/editions?ps5=1';
const R_SUPPORT = 'https://support.rockstargames.com/articles/4QfG4FmZCf5W1gS8jy4UVT/grand-theft-auto-vi-platform-editions-and-versions';
const EXT_LOOK = 'https://www.youtube.com/watch?v=tJbzMqJGH4k';
const TSA = 'https://www.thesixthaxis.com/2026/06/24/gta-6-ultimate-edition-pre-order-bonus-and-vintage-vice-city-pack-revealed/';
const DAZED = 'https://www.dazeddigital.com/life-culture/article/70859/1/gta-6-grand-theft-auto-vi-rockstar-exclusive-deep-dive-game-unparalleled-world';

/** hrefs are relative to the site base. */
export const guideSections: GuideSection[] = [
  {
    id: 'vehicles',
    title: 'Vehicles in GTA VI',
    status: 'Confirmed & Shown',
    paragraphs: [
      `GTA VI brings back familiar in-game manufacturers and models while adding vehicles created specifically for Leonida. Rockstar has named only part of the full lineup, so The Garage also documents vehicles identified in official trailers and screenshots. Each entry separates an official name from a visual identification.`,
      `The known lineup reaches beyond cars. Official material includes motorcycles, boats, a kayak, personal watercraft, helicopters, planes, and specialist vehicles alongside sedans, muscle cars, supercars, SUVs, off-road builds, and classics. A vehicle appearing in footage confirms that it exists in the world; it does not always prove that the player can own or drive it.`,
      `Open The Garage for individual models, GTA classes, manufacturers, first appearances, release information, and real-life inspirations. Prices and tested performance data will be added when they can be verified in the released game.`,
    ],
    cta: { label: 'Explore The Garage', href: 'garage/' },
    sources: [
      { label: 'Rockstar Games — GTA VI Media', url: R_MEDIA, note: 'official trailers and media library.' },
      { label: 'Rockstar Games — GTA VI Screenshots', url: R_SHOTS, note: 'official screenshot titles, including named Ultimate Edition vehicles.' },
      { label: 'Rockstar Support — GTA VI Platforms, Editions, and Versions', url: R_SUPPORT, note: 'named edition vehicles and content.' },
    ],
  },
  {
    id: 'driving',
    title: 'Driving and Vehicle Physics',
    status: 'Rockstar Interview',
    paragraphs: [
      `GTA VI’s driving model was rebuilt for the current hardware. Rockstar North co-studio head Rob Nelson says drivetrain, tires, suspension, and steering all feed into the vehicle physics, with the team aiming to combine the weight and feel associated with GTA IV with the accessibility of GTA V.`,
      `Rockstar has also assembled a vehicle-handling team that includes real race-car drivers. That signals serious attention to how vehicles behave, but it is not proof that GTA VI is a full driving simulation. Exact grip levels, drivetrain advantages, damage behavior, and the fastest cars still need to be tested in the released game.`,
    ],
    sources: [
      { label: 'GamesRadar — Rob Nelson on GTA VI driving physics', url: 'https://www.gamesradar.com/games/grand-theft-auto/gta-6-driving-is-the-best-parts-of-gta-4-but-with-the-accessibility-of-gta-5-says-rockstar-boss/', note: 'September 4, 2026: direct Nelson quotation covering drivetrain, tires, suspension, steering, and the rebuilt physics model.' },
      { label: 'Dazed — GTA VI: An Exclusive Deep Dive', url: DAZED, note: 'September 6, 2026: vehicle-handling team described as including race-car drivers.' },
    ],
  },
  {
    id: 'theft',
    title: 'Stealing, Scanning, Selling, and Registering Cars',
    status: 'Rockstar Interview',
    paragraphs: [
      `Stealing a parked car in GTA VI is no longer described as the same one-button job for every vehicle. Nelson says some cars remain inaccessible early in the story until Jason or Lucia obtains the right tools. Drivers can still be carjacked, but unattended vehicles may demand a quieter or more technical approach.`,
      `In a Rockstar-led demonstration, a phone scanner described by the preview as <strong>Waink</strong> displayed whether a car was locked, whether it had an alarm or tracker, what it could be worth, and how much it would cost to register. Nelson also named a Slim Jim and a key cloner as examples of tools used for different vehicles.`,
      `The same demonstration distinguished between selling a stolen car and registering it as your own. Pay ’n’ Spray and a specialist car fence were mentioned in that process. Rockstar has not yet published the full rules, including tracker removal, garage requirements, resale limits, or which cars can be registered.`,
    ],
    sources: [
      { label: 'MMO.net — “It’s a Step Forward in All Respects”: Interview with Rob Nelson', url: 'https://mmo.net/2026/08/27/its-a-step-forward-in-all-respects-exclusive-gta-6-interview/', note: 'August 27, 2026, section “You got a fast car…”: vehicle security, access tools, scanner information, sale value, and registration cost.' },
    ],
  },
  {
    id: 'ownership',
    title: 'Vehicle Ownership, Garages, and Safehouse Vehicles',
    status: 'Confirmed & Reported',
    paragraphs: [
      `GTA VI has personal vehicles and garages, but Rockstar has not published the complete ownership system. The registration mechanic described in the developer demonstration provides a way to turn at least some stolen cars into personal vehicles. How many vehicles each character can own, how garage capacity works, and whether vehicles can be moved freely between properties remain open questions.`,
      `Rockstar has named Jason’s Safehouse Vehicles as Ultimate Edition content and shown the Dinka Enduro motorcycle, Crest Kayak, and Ganado Retro Build under that label. The Ultimate Edition also includes the ’67 Vapid Dominator Buggy with a garage, while the Vintage Vice City Pack includes the ’55 Vapid Stanier Sedan with a garage.`,
      `The accompanying Rockstar press material identifies those locations as Paradise Garage in Watson Bay and Shore Court Garage near Ocean Beach. They are personal garages, not confirmed tuning shops.`,
    ],
    sources: [
      { label: 'Rockstar Games — GTA VI Editions', url: R_EDITIONS, note: 'Jason’s Safehouse Vehicles, Ganado Retro Build, and the named vehicle bonuses.' },
      { label: 'Rockstar Games — GTA VI Screenshots', url: R_SHOTS, note: '“Jason’s Safehouse Vehicles,” “Dinka Enduro Motorcycle,” “Crest Kayak,” and “Ganado Retro Build.”' },
      { label: 'Rockstar Support — GTA VI Platforms, Editions, and Versions', url: R_SUPPORT, note: 'edition and pre-order package contents.' },
      { label: 'TheSixthAxis — GTA VI Ultimate Edition and Vintage Vice City Pack', url: TSA, note: 'June 24, 2026: documentation of Rockstar’s accompanying descriptions for Paradise Garage and Shore Court Garage.' },
    ],
  },
  {
    id: 'customization',
    title: 'Car Customization and Mod Shops',
    status: 'Confirmed & Reported',
    paragraphs: [
      `Vehicle customization is confirmed for GTA VI. Rockstar has named two specialist shops included with the Ultimate Edition: <strong>Rideout Customs Mod Shop</strong> in Vice City and <strong>One-Eyed Willie’s Mod Shop</strong> in Lake Leonida.`,
      `Rockstar’s accompanying descriptions give the shops different identities. Rideout Customs focuses on detailed interiors, wheels, and donk builds. One-Eyed Willie’s specializes in off-road modifications and hand-painted vehicle designs. The same material describes the wider selection as both artistic and performance-oriented.`,
      `Official screenshots support those descriptions with custom upholstery, steering wheels, oversized street wheels, lifted off-road builds, protective hardware, and painted graphics. They show what finished vehicles can look like; they do not reveal a complete parts menu. Engine stages, transmissions, brakes, suspension options, compatibility, and prices remain unannounced.`,
    ],
    sources: [
      { label: 'Rockstar Games — GTA VI Editions', url: R_EDITIONS, note: 'names and Ultimate Edition inclusion.' },
      { label: 'Rockstar Games — GTA VI Screenshots', url: R_SHOTS, note: '“Rideout Customs Mod Shop 01–03” and “One-Eyed Willie’s Mod Shop 01–03.”' },
      { label: 'TheSixthAxis — GTA VI Ultimate Edition details', url: TSA, note: 'Rockstar press descriptions of the shops and their specialties.' },
      { label: 'GamesRadar — GTA VI activities and customization', url: 'https://www.gamesradar.com/games/grand-theft-auto/gta-6-new-gameplay-details-activities-customization-confirmed-63-screenshots/', note: 'corroborating coverage of Rockstar’s press material.' },
    ],
  },
  {
    id: 'classics',
    title: 'Classic Cars, Restoration, and Special Builds',
    status: 'Confirmed & Reported',
    paragraphs: [
      `GTA VI treats some vehicles as projects rather than finished purchases. The Ultimate Edition includes the <strong>Classic Car Collection</strong>, an assignment connected to collector and fixer Wyman. Rockstar’s accompanying description says players will find abandoned classics and unfinished builds and restore them for his collection.`,
      `The <strong>Ganado Retro Build</strong> is another confirmed example of a vehicle-specific conversion. Rockstar has shown and named the package for Jason’s Vapid Ganado. These examples prove that curated restorations and special builds exist, but they do not yet establish a universal restoration system for every car.`,
    ],
    sources: [
      { label: 'Rockstar Support — GTA VI Editions', url: R_SUPPORT, note: 'Classic Car Collection and Ganado Retro Build.' },
      { label: 'Rockstar Games — GTA VI Screenshots', url: R_SHOTS, note: '“Classic Car Collection 01–06” and “Ganado Retro Build.”' },
      { label: 'TheSixthAxis — GTA VI Ultimate Edition details', url: TSA, note: 'documentation of Rockstar’s restoration description.' },
    ],
  },
  {
    id: 'racing',
    title: 'Racing in GTA VI',
    status: 'Shown by Rockstar',
    paragraphs: [
      `GTA VI includes structured circuit, off-road, and street racing. Rockstar’s Extended Look shows all three with an active race HUD rather than presenting them only as background scenes.`,
      `At roughly 17:42, a 16-car race runs for two laps on a wet paved circuit, with position, lap, and timing information on screen. At roughly 18:35, an off-road event shows a 12-entry field on a dirt course. At roughly 20:23, a six-car street race uses a progress counter instead of a lap counter.`,
      `That footage confirms three distinct racing formats and visible event structure. Rockstar has not yet explained how races are entered, which vehicle classes they support, what they pay, whether championships exist, or how racing will work online.`,
    ],
    cta: { label: 'Go to Time Attack', href: 'time-attack/gellhorn-international-raceway/' },
    sources: [
      { label: 'Rockstar Games — Grand Theft Auto VI: An Extended Look', url: EXT_LOOK, note: 'August 27, 2026: circuit race at approximately 17:41–17:47, off-road race at 18:34–18:39, and street race at 20:21–20:25.' },
      { label: 'Rockstar Newswire — An Extended Look', url: 'https://www.rockstargames.com/newswire/article/4k138k8okkk483/grand-theft-auto-vi-an-extended-look-now-playing', note: 'confirms the presentation was captured entirely from in-game PlayStation 5 footage.' },
      { label: 'Game Informer — GTA VI: Welcome to Leonida', url: 'https://gameinformer.com/feature/2026/09/29/grand-theft-auto-vi-welcome-to-leonida', note: 'September 29, 2026: Rockstar cover story additionally identifies street and off-road racing among the activities; full article access may require a subscription.' },
    ],
  },
  {
    id: 'gellhorn',
    title: 'Gellhorn and the Circuit',
    status: 'Partially Confirmed',
    paragraphs: [
      `Rockstar has shown a dedicated paved race circuit in GTA VI, complete with a grid, curbing, timing, position, and lap information. Trailer 2 separately shows Lucia wearing clothing marked <strong>Gellhorn International</strong> with a race-car graphic.`,
      `The venue is widely known as <strong>Gellhorn International Raceway</strong>, and Leonida Racing uses that established name for its Time Attack competition. The source record remains more precise: Rockstar’s public footage shows the circuit and the Gellhorn International branding, but does not display the full venue name alongside the race. The complete layout, location, classes, and event schedule remain unannounced.`,
    ],
    cta: { label: 'Visit Gellhorn Time Attack', href: 'time-attack/gellhorn-international-raceway/' },
    sources: [
      { label: 'Rockstar Games — Grand Theft Auto VI: An Extended Look', url: EXT_LOOK, note: 'approximately 17:41–17:47: official circuit-racing footage.' },
      { label: 'Rockstar Games — GTA VI Trailer 2', url: 'https://www.youtube.com/watch?v=VQRLujxTm3c', note: 'approximately 1:57: “Gellhorn International” clothing and race-car graphic.' },
    ],
  },
  {
    id: 'car-culture',
    title: 'Car Meets, Street Takeovers, and Car Culture',
    status: 'Shown by Rockstar',
    paragraphs: [
      `Car culture is part of GTA VI’s world before the first garage door even opens. Trailer 1 shows a street takeover built around burnouts, crowds, and heavily customized cars. The Extended Look later shows a parking-lot meet with multiple builds gathered in one place.`,
      `Donks, lifted trucks, off-road builds, custom interiors, wheels, liveries, and painted graphics appear throughout Rockstar’s material. Rideout Customs branding was visible in Trailer 1 before Rockstar formally named the shop. <strong>Vice Vinyl</strong> appears in the same footage, but Rockstar has not explained whether it is a business, a product brand, or environmental detail.`,
      `These scenes establish the look and presence of Leonida’s car culture. They do not yet confirm player-hosted meets, takeover events, judging systems, or rewards.`,
    ],
    cta: { label: 'Find Community Events', href: 'hub/events/' },
    sources: [
      { label: 'Rockstar Games — GTA VI Trailer 1', url: 'https://www.youtube.com/watch?v=QdBZY2fkU-0', note: 'approximately 0:45–0:52: street takeover, customized vehicles, Rideout Customs and Vice Vinyl branding.' },
      { label: 'Rockstar Games — Grand Theft Auto VI: An Extended Look', url: EXT_LOOK, note: 'approximately 26:06: parking-lot car-meet scene.' },
      { label: 'Rockstar Games — GTA VI Screenshots', url: R_SHOTS, note: 'official mod-shop and custom-vehicle imagery.' },
    ],
  },
  {
    id: 'other-vehicles',
    title: 'Motorcycles, Boats, Watercraft, and Aircraft',
    status: 'Confirmed & Shown',
    paragraphs: [
      `Leonida is built for more than four wheels. Rockstar has named the Dinka Enduro motorcycle, Crest Kayak, and Shitzu Squalo boat as edition content. Official footage also shows dirt bikes, personal watercraft, speedboats, helicopters, and fixed-wing aircraft across the state.`,
      `Dazed describes Jason and Lucia riding a jetski together, which directly establishes at least one playable form of personal watercraft. For many other aircraft and boats, official footage confirms their presence without defining ownership, storage, customization, or full player access.`,
    ],
    sources: [
      { label: 'Rockstar Games — GTA VI Editions', url: R_EDITIONS, note: 'Dinka Enduro, Crest Kayak, and Shitzu Squalo package content.' },
      { label: 'Rockstar Games — GTA VI Media', url: R_MEDIA, note: 'official videos and imagery showing land, water, and air vehicles.' },
      { label: 'Dazed — GTA VI: An Exclusive Deep Dive', url: DAZED, note: 'Jason and Lucia using a jetski.' },
    ],
  },
  {
    id: 'not-confirmed',
    title: 'What Rockstar Has Not Confirmed Yet',
    status: 'Not Confirmed',
    paragraphs: [
      `Several details players naturally want to know are still open. Rockstar has not published a complete vehicle list, dealership structure, garage-capacity system, tuning catalog, parts compatibility list, upgrade pricing, or final performance figures.`,
      `Public material also leaves the full damage model, fuel use, EV charging, insurance, vehicle recovery, wheel support, manual shifting, race creation tools, and GTA VI online racing systems unresolved. Some of these subjects have appeared in preview reports or community analysis, but Leonida Racing will not present them as confirmed until the supporting source is strong enough.`,
      `This section will shrink as Rockstar releases more information and the finished game provides testable answers. Until then, “not confirmed” means exactly that—not impossible, not secretly ruled out, just not ready to call a fact.`,
    ],
    sourcesHeading: 'Official material checked for this section',
    sources: [
      { label: 'Rockstar Games — Grand Theft Auto VI', url: 'https://www.rockstargames.com/VI', note: '' },
      { label: 'Rockstar Games — GTA VI Media', url: R_MEDIA, note: '' },
      { label: 'Rockstar Games — GTA VI Editions', url: R_EDITIONS, note: '' },
      { label: 'Rockstar Support — GTA VI Platforms, Editions, and Versions', url: R_SUPPORT, note: '' },
    ],
  },
];

/** "How Leonida Racing Covers ..." — The Lab line removed until the section exists. */
export const guideCoverage: { name: string; text: string }[] = [
  { name: 'The Garage', text: 'is the vehicle database: models, classes, manufacturers, real-life inspirations, release information, and available specs.' },
  { name: 'Time Attack', text: 'puts drivers and cars on the same course, with proof-based lap submissions and leaderboards at Gellhorn.' },
  { name: 'The Hub', text: 'connects the scene through races, league rounds, playlists, car meets, crews, hosts, and creators.' },
  { name: 'The Guide', text: 'explains what is known, shows where the information came from, and keeps confirmed facts separate from strong identifications and open questions.' },
];

/** FAQ: the same text is used for the visible answers and FAQPage JSON-LD. */
export const guideFaq: { q: string; a: string }[] = [
  { q: 'What vehicles are confirmed for GTA VI?', a: 'Rockstar has named selected cars, motorcycles, boats, and other vehicles through its editions pages and official screenshots. Many more vehicles are visible in trailers without being named by Rockstar. The Garage separates officially named models from visual identifications.' },
  { q: 'How does stealing cars work in GTA VI?', a: 'Rockstar North’s Rob Nelson described a tiered system. Some parked vehicles require tools such as a Slim Jim or key cloner, while occupied vehicles can still be carjacked. A phone scanner can provide information about a vehicle’s security, tracker, value, and registration cost.' },
  { q: 'Can stolen cars become personal vehicles?', a: 'The Rockstar-led demonstration included a cost to register a vehicle as your own. The complete conditions, storage requirements, and eligible vehicle list have not been published.' },
  { q: 'Does GTA VI have car customization?', a: 'Yes. Rockstar has confirmed specialist mod shops and described cosmetic and performance-oriented modifications. The complete parts catalog and standard-edition workshop options remain unknown.' },
  { q: 'What mod shops are confirmed for GTA VI?', a: 'Rideout Customs Mod Shop and One-Eyed Willie’s Mod Shop are confirmed as Ultimate Edition content. Rideout Customs focuses on interiors, wheels, and donk builds; One-Eyed Willie’s specializes in off-road modifications and hand-painted designs.' },
  { q: 'Does GTA VI have garages?', a: 'Yes. Rockstar has named garage content connected to the ’67 Vapid Dominator Buggy and ’55 Vapid Stanier, and it has shown Jason’s Safehouse Vehicles. The wider garage and capacity system has not been fully explained.' },
  { q: 'What kinds of racing are shown in GTA VI?', a: 'Official in-game footage shows circuit, off-road, and street racing with position and timing information on screen. Event access, rewards, classes, championships, and online support remain open.' },
  { q: 'Is Gellhorn International Raceway confirmed?', a: 'Rockstar has shown a dedicated paved circuit and separate Gellhorn International racing branding. Leonida Racing uses the established name Gellhorn International Raceway, while noting that Rockstar’s public footage has not yet displayed the complete venue name beside the circuit.' },
  { q: 'Are car meets confirmed in GTA VI?', a: 'Rockstar has shown car-meet and street-takeover scenes. Those scenes confirm the culture and setting, but Rockstar has not yet announced a player-hosted car-meet system.' },
  { q: 'Will GTA VI have a Race Creator?', a: 'Rockstar has not confirmed a Race Creator or player-built race jobs for GTA VI. The Hub will add community-created tracks when compatible creation tools become available.' },
  { q: 'Where can I compare GTA VI cars?', a: 'The Garage lets you browse GTA VI vehicles by class and manufacturer and compare the details currently available. Verified prices, tested top speeds, and performance data will follow when the released game makes reliable testing possible.' },
];

export const guideMethodology: string[] = [
  `Leonida Racing separates information into six public evidence levels: <strong>Confirmed by Rockstar</strong>, <strong>Shown by Rockstar</strong>, <strong>Rockstar Interview</strong>, <strong>Reported from a Rockstar Demo</strong>, <strong>Community Identification</strong>, and <strong>Not Confirmed</strong>.`,
  `Official footage proves only what can be seen. A visible spoiler does not automatically prove a selectable spoiler upgrade, and a car at a meet does not automatically prove a player-hosted event system. Vehicle names and real-life inspirations identified by the community are labeled separately from Rockstar-confirmed names.`,
  `Sources are attached to the section they support, with timestamps for videos and official titles for screenshots. The page is updated when a new source changes the known facts—not simply because another site repeats the same claim.`,
];
