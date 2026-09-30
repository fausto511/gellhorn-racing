// Mirrors the real vehicles seed in supabase/seed.sql (generated from
// scripts/generate_vehicle_seed.py). Keep in sync when the source workbook
// changes -- this static list is only a stand-in for a live Supabase fetch,
// since submit-lap needs a real Supabase project to actually call.
export interface VehicleOption {
  id: string;
  classes: string[];
  make: string;
  model: string;
  logoSlug: string;
  seats: number;
  drive: string;
  // Release metadata (RS-0047, DEC-0084; mirrors public.vehicles in Supabase).
  // releaseId -> data/releases.ts (game_releases): the content release that adds
  // the vehicle (Base Game, later updates/DLCs); release date comes from there.
  // Unset = not officially announced (leak-only) -> shown as "TBA".
  releaseId?: string;
  firstSeenIn?: string; // earliest official appearance; unset for leak-only vehicles
  realLifeInspiration?: string; // one editorially chosen real-world model
  // Access requirement, independent of releaseId (a launch car can still need the Ultimate Edition):
  acquisition?: 'pre-order' | 'ultimate-edition' | 'gta-plus';
  // true = a garage photo exists at public/images/vehicles/<id>-{640,1280,1920}.webp
  // (made from "Visual/Cars/<Make Model> Garage.jpg", 2026-09-30).
  photo?: boolean;
}

// RULE (Fausto, 2026-09-30): vehicleOptions lists ONLY vehicles whose GTA VI
// in-game name is verified (exception: Übermacht Sentinel Classic Cabrio).
// Everything here is public: garage, vehicle pages, sitemap, submit form,
// compare. Cars seen in GTA VI material whose in-game name is still unknown
// go into unverifiedVehicles below instead -- never shown on the site.

export const vehicleOptions: VehicleOption[] = [
  { id: "vapid-stanier-55", classes: ["Sedans"], make: "Vapid", model: "Stanier '55", logoSlug: "vapid", seats: 2, drive: "RWD", acquisition: "pre-order", photo: true, releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Fairlane Club Sedan (1956)" },
  { id: "grotti-cheetah-95", classes: ["Sports Classics"], make: "Grotti", model: "Cheetah '95", logoSlug: "grotti", seats: 2, drive: "RWD", acquisition: "ultimate-edition", photo: true, releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ferrari Testarossa" },
  { id: "schyster-deviant", classes: ["Muscle"], make: "Schyster", model: "Deviant", logoSlug: "schyster", seats: 2, drive: "RWD", acquisition: "ultimate-edition", photo: true, releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "AMC Javelin (1972)" },
  { id: "declasse-mamba-gt", classes: ["Sports Classics"], make: "Declasse", model: "Mamba GT", logoSlug: "declasse", seats: 2, drive: "RWD", acquisition: "ultimate-edition", photo: true, releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Shelby Daytona Coupe" },
  { id: "vapid-riata-classic", classes: ["SUVs"], make: "Vapid", model: "Riata Classic", logoSlug: "vapid", seats: 2, drive: "n/a", acquisition: "ultimate-edition", photo: true, releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Ford Bronco (first generation)" },
  { id: "dundreary-sirius", classes: ["Muscle"], make: "Dundreary", model: "Sirius", logoSlug: "dundreary", seats: 2, drive: "n/a", acquisition: "ultimate-edition", photo: true, releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Mercury Cougar (1970)" },
  { id: "obey-8f-drafter", classes: ["Sports"], make: "Obey", model: "8F Drafter", logoSlug: "obey", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Audi RS5 Coupé (2018)" },
  { id: "vapid-aleutian", classes: ["SUVs"], make: "Vapid", model: "Aleutian", logoSlug: "vapid", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Ford Expedition (U553)" },
  { id: "albany-alpha", classes: ["Sports"], make: "Albany", model: "Alpha", logoSlug: "albany", seats: 2, drive: "RWD", realLifeInspiration: "Cadillac ATS" },
  { id: "karin-asterope-gz", classes: ["Sedans"], make: "Karin", model: "Asterope GZ", logoSlug: "karin", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Toyota Camry (XV30)" },
  { id: "pfister-astron", classes: ["SUVs"], make: "Pfister", model: "Astron", logoSlug: "pfister", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Porsche Macan" },
  { id: "gallivanter-baller-ii", classes: ["SUVs"], make: "Gallivanter", model: "Baller II", logoSlug: "gallivanter", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Range Rover Sport" },
  { id: "gallivanter-baller-st-d", classes: ["SUVs"], make: "Gallivanter", model: "Baller ST-D", logoSlug: "gallivanter", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Range Rover (L460)" },
  { id: "bravado-banshee", classes: ["Sports"], make: "Bravado", model: "Banshee", logoSlug: "bravado", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Dodge Viper" },
  { id: "dinka-blista-compact", classes: ["Sports"], make: "Dinka", model: "Blista Compact", logoSlug: "dinka", seats: 2, drive: "FWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Honda CR-X (first generation)" },
  { id: "albany-buccaneer", classes: ["Muscle"], make: "Albany", model: "Buccaneer", logoSlug: "albany", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Fairlane" },
  { id: "albany-buccaneer-custom", classes: ["Muscle"], make: "Albany", model: "Buccaneer Custom", logoSlug: "albany", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Fairlane" },
  { id: "bravado-buffalo", classes: ["Sports"], make: "Bravado", model: "Buffalo", logoSlug: "bravado", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Dodge Charger" },
  { id: "bravado-buffalo-stx", classes: ["Muscle"], make: "Bravado", model: "Buffalo STX", logoSlug: "bravado", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Dodge Charger (2015)" },
  { id: "grotti-carbonizzare", classes: ["Sports"], make: "Grotti", model: "Carbonizzare", logoSlug: "grotti", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Aston Martin V12 Zagato" },
  { id: "albany-cavalcade-xl", classes: ["SUVs"], make: "Albany", model: "Cavalcade XL", logoSlug: "albany", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Cadillac Escalade-V (2023)" },
  { id: "vapid-chino", classes: ["Muscle"], make: "Vapid", model: "Chino", logoSlug: "vapid", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Lincoln Continental (1965)" },
  { id: "pfister-comet-retro-custom", classes: ["Sports"], make: "Pfister", model: "Comet Retro Custom", logoSlug: "pfister", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Porsche 911 Turbo (930) with RWB styling" },
  { id: "pfister-comet-s2-cabrio", classes: ["Sports"], make: "Pfister", model: "Comet S2 Cabrio", logoSlug: "pfister", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Porsche 911 Turbo S Cabriolet (992)" },
  { id: "karin-contender", classes: ["SUVs"], make: "Karin", model: "Contender", logoSlug: "karin", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Toyota Tundra" },
  { id: "invetero-coquette", classes: ["Sports"], make: "Invetero", model: "Coquette", logoSlug: "invetero", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Chevrolet Corvette C7" },
  { id: "invetero-coquette-d10", classes: ["Sports"], make: "Invetero", model: "Coquette D10", logoSlug: "invetero", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Chevrolet Corvette C8" },
  { id: "ubermacht-cypher", classes: ["Sports"], make: "Übermacht", model: "Cypher", logoSlug: "ubermacht", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "BMW M2 (F87)" },
  { id: "imponte-df8-90", classes: ["Sedans"], make: "Imponte", model: "DF8-90", logoSlug: "imponte", seats: 4, drive: "RWD", realLifeInspiration: "Pontiac G6" },
  { id: "vapid-dominator", classes: ["Muscle"], make: "Vapid", model: "Dominator", logoSlug: "vapid", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Mustang (fifth generation)" },
  { id: "vapid-dominator-asp", classes: ["Muscle"], make: "Vapid", model: "Dominator ASP", logoSlug: "vapid", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Mustang SVT Cobra R (2000)" },
  { id: "vapid-dominator-gt", classes: ["Muscle"], make: "Vapid", model: "Dominator GT", logoSlug: "vapid", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Ford Mustang Convertible (2018–2023)" },
  { id: "vapid-dominator-gtx", classes: ["Muscle"], make: "Vapid", model: "Dominator GTX", logoSlug: "vapid", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Mustang (sixth generation)" },
  { id: "bravado-dorado", classes: ["SUVs"], make: "Bravado", model: "Dorado", logoSlug: "bravado", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Dodge Durango (first generation)" },
  { id: "benefactor-dubsta", classes: ["SUVs"], make: "Benefactor", model: "Dubsta", logoSlug: "benefactor", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Mercedes-Benz G-Class" },
  { id: "annis-elegy-retro-custom", classes: ["Sports"], make: "Annis", model: "Elegy Retro Custom", logoSlug: "annis", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Nissan Skyline GT-R R32" },
  { id: "albany-emperor", classes: ["Sedans"], make: "Albany", model: "Emperor", logoSlug: "albany", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Cadillac Sedan de Ville (1977–1980)" },
  { id: "karin-feroci", classes: ["Sedans"], make: "Karin", model: "Feroci", logoSlug: "karin", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Lexus GS 300 (S140)" },
  { id: "grotti-furia", classes: ["Super"], make: "Grotti", model: "Furia", logoSlug: "grotti", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Pininfarina Battista" },
  { id: "karin-futo", classes: ["Sports"], make: "Karin", model: "Futo", logoSlug: "karin", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Toyota Corolla Levin AE86" },
  { id: "vapid-ganado-70", classes: ["Muscle"], make: "Vapid", model: "Ganado '70", logoSlug: "vapid", seats: 2, drive: "n/a", photo: true, releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Ford Ranchero (1970)" },
  { id: "bravado-gauntlet-classic", classes: ["Muscle"], make: "Bravado", model: "Gauntlet Classic", logoSlug: "bravado", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Dodge Challenger (first generation)" },
  { id: "bravado-gauntlet-hellfire", classes: ["Muscle"], make: "Bravado", model: "Gauntlet Hellfire", logoSlug: "bravado", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Dodge Challenger SRT Demon (2018)" },
  { id: "declasse-granger", classes: ["SUVs"], make: "Declasse", model: "Granger", logoSlug: "declasse", seats: 8, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Chevrolet Suburban" },
  { id: "declasse-granger-3600lx", classes: ["SUVs"], make: "Declasse", model: "Granger 3600LX", logoSlug: "declasse", seats: 8, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Chevrolet Suburban (2015–2020)" },
  { id: "pfister-growler", classes: ["Sports"], make: "Pfister", model: "Growler", logoSlug: "pfister", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Porsche 718 Cayman" },
  { id: "declasse-impaler-80", classes: ["Muscle"], make: "Declasse", model: "Impaler '80", logoSlug: "declasse", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Chevrolet Impala (sixth generation)" },
  { id: "declasse-impaler-sz", classes: ["Muscle"], make: "Declasse", model: "Impaler SZ", logoSlug: "declasse", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Chevrolet Impala SS (1994–1996)" },
  { id: "vulcar-ingot", classes: ["Sedans"], make: "Vulcar", model: "Ingot", logoSlug: "vulcar", seats: 4, drive: "FWD", realLifeInspiration: "Volkswagen Passat wagon" },
  { id: "karin-intruder", classes: ["Sedans"], make: "Karin", model: "Intruder", logoSlug: "karin", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Infiniti Q45" },
  { id: "buckingham-jubilee", classes: ["SUVs"], make: "Buckingham", model: "Jubilee", logoSlug: "buckingham", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Rolls-Royce Cullinan" },
  { id: "ocelot-jugular", classes: ["Sports"], make: "Ocelot", model: "Jugular", logoSlug: "ocelot", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Jaguar XE SV Project 8" },
  { id: "dundreary-landstalker-xl", classes: ["SUVs"], make: "Dundreary", model: "Landstalker XL", logoSlug: "dundreary", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Lincoln Navigator (fourth generation)" },
  { id: "ocelot-locust", classes: ["Sports"], make: "Ocelot", model: "Locust", logoSlug: "ocelot", seats: 2, drive: "RWD", realLifeInspiration: "Lotus 3-Eleven" },
  { id: "albany-manana", classes: ["Sports Classics"], make: "Albany", model: "Manana", logoSlug: "albany", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Buick LeSabre" },
  { id: "canis-mesa", classes: ["SUVs"], make: "Canis", model: "Mesa", logoSlug: "canis", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Jeep Wrangler" },
  { id: "vapid-montagne", classes: ["SUVs"], make: "Vapid", model: "Montagne", logoSlug: "vapid", seats: 4, drive: "n/a", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Ford Explorer (sixth generation)" },
  { id: "declasse-moonbeam", classes: ["Muscle"], make: "Declasse", model: "Moonbeam", logoSlug: "declasse", seats: 4, drive: "RWD", realLifeInspiration: "Chevrolet Astro (1985–1994)" },
  { id: "lampadati-novak", classes: ["SUVs"], make: "Lampadati", model: "Novak", logoSlug: "lampadati", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Maserati Levante" },
  { id: "obey-omnis-e-gt", classes: ["Sports"], make: "Obey", model: "Omnis e-GT", logoSlug: "obey", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Audi e-tron GT" },
  { id: "enus-paragon-r", classes: ["Sports"], make: "Enus", model: "Paragon R", logoSlug: "enus", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Bentley Continental GT (third generation)" },
  { id: "maibatsu-penumbra", classes: ["Sports"], make: "Maibatsu", model: "Penumbra", logoSlug: "maibatsu", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Mitsubishi Eclipse (fourth generation)" },
  { id: "imponte-phoenix", classes: ["Muscle"], make: "Imponte", model: "Phoenix", logoSlug: "imponte", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Pontiac Firebird (second generation)" },
  { id: "schyster-pmp-700", classes: ["Sedans"], make: "Schyster", model: "PMP 700", logoSlug: "schyster", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Chrysler 300 (LD)" },
  { id: "albany-primo", classes: ["Sedans"], make: "Albany", model: "Primo", logoSlug: "albany", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Pontiac Bonneville (late 1980s)" },
  { id: "coil-raiden", classes: ["Sports"], make: "Coil", model: "Raiden", logoSlug: "coil", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Tesla Model S" },
  { id: "dundreary-regina", classes: ["Sedans"], make: "Dundreary", model: "Regina", logoSlug: "dundreary", seats: 4, drive: "RWD", realLifeInspiration: "Chevrolet Caprice wagon" },
  { id: "imponte-ruiner", classes: ["Muscle"], make: "Imponte", model: "Ruiner", logoSlug: "imponte", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Pontiac Firebird Trans Am (third generation)" },
  { id: "declasse-sabre-turbo", classes: ["Muscle"], make: "Declasse", model: "Sabre Turbo", logoSlug: "declasse", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Chevrolet Chevelle" },
  { id: "benefactor-schafter-v12", classes: ["Sedans", "Sports"], make: "Benefactor", model: "Schafter V12", logoSlug: "benefactor", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Brabus E V12" },
  { id: "canis-seminole-frontier", classes: ["SUVs"], make: "Canis", model: "Seminole Frontier", logoSlug: "canis", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Jeep Cherokee (XJ)" },
  { id: "ubermacht-sentinel-classic", classes: ["Sports Classics"], make: "Übermacht", model: "Sentinel Classic", logoSlug: "ubermacht", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "BMW M3 (E30)" },
  { id: "ubermacht-sentinel-xs", classes: ["Coupes"], make: "Übermacht", model: "Sentinel XS", logoSlug: "ubermacht", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "BMW M3 (E92)" },
  { id: "vapid-slamvan", classes: ["Muscle"], make: "Vapid", model: "Slamvan", logoSlug: "vapid", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford F-Series (1953–1956)" },
  { id: "vapid-stanier", classes: ["Sedans"], make: "Vapid", model: "Stanier", logoSlug: "vapid", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Ford Crown Victoria" },
  { id: "zirconium-stratum", classes: ["Sedans"], make: "Zirconium", model: "Stratum", logoSlug: "zirconium", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Honda Accord wagon" },
  { id: "dinka-sugoi", classes: ["Sports"], make: "Dinka", model: "Sugoi", logoSlug: "dinka", seats: 4, drive: "FWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Honda Civic Type R FK8" },
  { id: "karin-sultan", classes: ["Sports"], make: "Karin", model: "Sultan", logoSlug: "karin", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Lexus IS (XE10)" },
  { id: "obey-tailgater", classes: ["Sedans"], make: "Obey", model: "Tailgater", logoSlug: "obey", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Audi A6" },
  { id: "obey-tailgater-s", classes: ["Sedans"], make: "Obey", model: "Tailgater S", logoSlug: "obey", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Audi RS3 Sedan" },
  { id: "pegassi-tempesta", classes: ["Super"], make: "Pegassi", model: "Tempesta", logoSlug: "pegassi", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Lamborghini Huracán" },
  { id: "truffade-thrax", classes: ["Super"], make: "Truffade", model: "Thrax", logoSlug: "truffade", seats: 2, drive: "AWD", realLifeInspiration: "Bugatti Divo" },
  { id: "declasse-tornado", classes: ["Sports Classics"], make: "Declasse", model: "Tornado", logoSlug: "declasse", seats: 2, drive: "RWD", realLifeInspiration: "Chevrolet Bel Air" },
  { id: "pegassi-toros", classes: ["SUVs"], make: "Pegassi", model: "Toros", logoSlug: "pegassi", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Lamborghini Urus" },
  { id: "declasse-tulip", classes: ["Muscle"], make: "Declasse", model: "Tulip", logoSlug: "declasse", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Chevrolet Chevelle Malibu (1972)" },
  { id: "declasse-tulip-m-100", classes: ["Muscle"], make: "Declasse", model: "Tulip M-100", logoSlug: "declasse", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Chevrolet Malibu (fourth generation)" },
  { id: "albany-v-str", classes: ["Sports"], make: "Albany", model: "V-STR", logoSlug: "albany", seats: 4, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Cadillac CTS-V (third generation)" },
  { id: "declasse-vamos", classes: ["Muscle"], make: "Declasse", model: "Vamos", logoSlug: "declasse", seats: 2, drive: "RWD", realLifeInspiration: "Chevrolet Nova" },
  { id: "emperor-vectre", classes: ["Sports"], make: "Emperor", model: "Vectre", logoSlug: "emperor", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Lexus RC F" },
  { id: "declasse-vigero-zx-convertible", classes: ["Muscle"], make: "Declasse", model: "Vigero ZX Convertible", logoSlug: "declasse", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Chevrolet Camaro (sixth generation)" },
  { id: "karin-vivanite", classes: ["SUVs"], make: "Karin", model: "Vivanite", logoSlug: "karin", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Toyota Sienna (XL40)" },
  { id: "enus-windsor", classes: ["Coupes"], make: "Enus", model: "Windsor", logoSlug: "enus", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Rolls-Royce Wraith" },
  { id: "benefactor-xls", classes: ["SUVs"], make: "Benefactor", model: "XLS", logoSlug: "benefactor", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Mercedes-Benz GL-Class" },
  { id: "ubermacht-zion", classes: ["Coupes"], make: "Übermacht", model: "Zion", logoSlug: "ubermacht", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "BMW M6 (E63)" },
  { id: "ubermacht-zion-cabrio", classes: ["Coupes"], make: "Übermacht", model: "Zion Cabrio", logoSlug: "ubermacht", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "BMW M6 Convertible (E64)" },
  { id: "pegassi-zorrusso", classes: ["Super"], make: "Pegassi", model: "Zorrusso", logoSlug: "pegassi", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Italdesign Zerouno" },
  // Added 2026-09-19, sourced from gtabase.com's dedicated GTA 6 pages (seats/drive/class confirmed there):
  { id: "karin-rebel", classes: ["Off-Road"], make: "Karin", model: "Rebel", logoSlug: "karin", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Toyota Hilux" },
  { id: "vapid-caracara-4x4", classes: ["Off-Road"], make: "Vapid", model: "Caracara 4x4", logoSlug: "vapid", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 2", realLifeInspiration: "Ford F-150 Raptor (second generation)" },
  { id: "pfister-neon", classes: ["Sports"], make: "Pfister", model: "Neon", logoSlug: "pfister", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Porsche Taycan" },
  { id: "annis-hellion", classes: ["Off-Road"], make: "Annis", model: "Hellion", logoSlug: "annis", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "Trailer 1", realLifeInspiration: "Nissan Patrol Safari Y60" },
  { id: "pegassi-infernus-classic", classes: ["Sports Classics"], make: "Pegassi", model: "Infernus Classic", logoSlug: "pegassi", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Lamborghini Diablo" },
  // Added 2026-09-19, Fausto hat alle fuenf selbst im Trailer identifiziert; seats/drive/class
  // fuer die GTA-5-Vorgaenger von gtabase.com uebernommen (Fausto: gleiche Werte gelten fuer GTA 6),
  // ausser Sentinel Classic Cabrio (neu, Werte von der bestehenden Sentinel-Classic-Basisversion geerbt):
  { id: "fathom-fr36", classes: ["Coupes"], make: "Fathom", model: "FR36", logoSlug: "fathom", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Infiniti G35 Coupé (V35)" },
  { id: "mammoth-patriot-mil-spec", classes: ["Off-Road"], make: "Mammoth", model: "Patriot Mil-Spec", logoSlug: "mammoth", seats: 4, drive: "AWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Hummer H1" },
  { id: "grotti-itali-rsx", classes: ["Sports"], make: "Grotti", model: "Itali RSX", logoSlug: "grotti", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Ferrari SF90 Stradale" },
  { id: "maibatsu-penumbra-ff", classes: ["Sports"], make: "Maibatsu", model: "Penumbra FF", logoSlug: "maibatsu", seats: 2, drive: "AWD", releaseId: "base-game", firstSeenIn: "An Extended Look", realLifeInspiration: "Mitsubishi Eclipse (second generation)" },
  { id: "ubermacht-sentinel-classic-cabrio", classes: ["Sports Classics"], make: "Übermacht", model: "Sentinel Classic Cabrio", logoSlug: "ubermacht", seats: 2, drive: "RWD", releaseId: "base-game", firstSeenIn: "GTA VI promotional website", realLifeInspiration: "BMW 3 Series Cabriolet (E30)" },
  // Added 2026-09-30 from gtabase.com GTA 6 pages (Fausto supplied the photos).
  // Kamacho: also in GTA Online, gtabase does not separate the values; no edition given there.
  // Dominator '67 Buggy: new in GTA VI, Ultimate Edition; drivetrain not given on gtabase.
  { id: "canis-kamacho", classes: ["Off-Road"], make: "Canis", model: "Kamacho", logoSlug: "canis", seats: 4, drive: "AWD", photo: true, releaseId: "base-game", firstSeenIn: "Official screenshots", realLifeInspiration: "Jeep Crew Chief 715 concept" },
  { id: "vapid-dominator-67-buggy", classes: ["Off-Road"], make: "Vapid", model: "Dominator '67 Buggy", logoSlug: "vapid", seats: 2, drive: "n/a", acquisition: "ultimate-edition", photo: true, releaseId: "base-game", firstSeenIn: "Ultimate Edition reveal", realLifeInspiration: "Ford Mustang (first generation)" },
];

// Garage tile order (RS-0049, DEC-0086, Fausto 2026-09-30):
//  1. vehicles with a photo first (only matters while photos are missing;
//     once every vehicle has one, this step has no effect),
//  2. then special-access vehicles (any `acquisition`: pre-order, Ultimate Edition, GTA+, ...),
//  3. then alphabetical by model name.
// The garage never relies on the order of vehicleOptions in this file.
export function compareGarageOrder(a: VehicleOption, b: VehicleOption): number {
  return (Number(!!b.photo) - Number(!!a.photo))
    || (Number(!!b.acquisition) - Number(!!a.acquisition))
    || a.model.localeCompare(b.model, 'en', { numeric: true, sensitivity: 'base' })
    || a.make.localeCompare(b.make, 'en', { sensitivity: 'base' });
}
export const garageOrderedVehicles: VehicleOption[] = [...vehicleOptions].sort(compareGarageOrder);

// Seen in GTA VI material, in-game name NOT verified -> not on the site and
// not in the database (class/seats/drive unknown, nothing to reference it).
// Once Rockstar names it: add it to vehicleOptions with the real name, add
// the DB row, and build the photo from the source file.
export interface UnverifiedVehicle { workingId: string; basedOn: string; photoSource: string; note: string }
export const unverifiedVehicles: UnverifiedVehicle[] = [
  { workingId: "unnamed-kellison-j4-inspired", basedOn: "Kellison J4 (1960s US kit sports car)", photoSource: "Visual/Cars/Kellison J4 Garage.jpg", note: "GTA Wiki lists it as a Kellison J4-inspired car without in-game name or manufacturer (checked 2026-09-30)." },
];
