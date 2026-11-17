/* Section « Concepts » du site Weskale Studio : la liste des démos.
 *
 * EN REFONTE : un slug par ligne. Quand un site est terminé, supprimer sa ligne.
 *
 * UNIVERS : nom complet (titres) et nom court (onglets du filtre),
 *           en français (nom, court) et en anglais (nom_en, court_en).
 *
 * SITES : un site par ligne, rangé dans son univers.
 *   metier, lieu : texte français ; metier_en, lieu_en : texte anglais.
 *   marque_en : seulement si le nom de la marque change en anglais.
 *
 * La langue est choisie par section.js d'après <html lang>.
 */
window.WESKALE_EN_REFONTE = [
];

window.WESKALE_UNIVERS = [
  { id: "luxe",      nom: "Luxe et objets",               court: "Luxe",         nom_en: "Luxury goods",                court_en: "Luxury" },
  { id: "auto",      nom: "Automobile",                   court: "Automobile",   nom_en: "Automotive",                  court_en: "Automotive" },
  { id: "immo",      nom: "Immobilier et hôtellerie",     court: "Immobilier",   nom_en: "Real estate and hospitality", court_en: "Real estate" },
  { id: "table",     nom: "Restauration et événementiel", court: "Restauration", nom_en: "Food and events",             court_en: "Food" },
  { id: "sante",     nom: "Santé et soin",                court: "Santé",        nom_en: "Health and care",             court_en: "Health" },
  { id: "services",  nom: "Services et SaaS",             court: "Services",     nom_en: "Services and SaaS",           court_en: "Services" },
  { id: "sport",     nom: "Sport",                        court: "Sport",        nom_en: "Sports",                      court_en: "Sports" },
  { id: "education", nom: "Éducation",                    court: "Éducation",    nom_en: "Education",                   court_en: "Education" }
];

window.WESKALE_SITES = [
  { slug: "vaurel-geneve",     univers: "luxe",      marque: "Vaurel",              metier: "Maison horlogère",                      lieu: "Genève",            metier_en: "Watchmaking house",                       lieu_en: "Geneva" },
  { slug: "maison-ilvane",     univers: "luxe",      marque: "Maison Ilvane",       metier: "Haute joaillerie",                      lieu: "Paris",             metier_en: "High jewellery",                          lieu_en: "Paris" },
  { slug: "aerol",             univers: "luxe",      marque: "Aerol",               metier: "Casque audio premium",                  lieu: "Boutique en ligne", metier_en: "Premium headphones",                      lieu_en: "Online store" },
  { slug: "noctrn",            univers: "luxe",      marque: "NOCTRN",              metier: "Vêtements techniques de nuit",          lieu: "Boutique en ligne", metier_en: "Technical nightwear",                     lieu_en: "Online store" },

  { slug: "velloria-drive",    univers: "auto",      marque: "Velloria",            metier: "Location de voitures d'exception",      lieu: "Dubaï",             metier_en: "Exceptional car rental",                  lieu_en: "Dubai" },
  { slug: "kirae-cars",        univers: "auto",      marque: "Kirae",               metier: "Location de voitures",                  lieu: "Marrakech",         metier_en: "Car rental",                              lieu_en: "Marrakech" },

  { slug: "halden-properties", univers: "immo",      marque: "Halden Properties",   metier: "Promoteur sur plan",                    lieu: "Dubaï",             metier_en: "Off-plan developer",                      lieu_en: "Dubai" },
  { slug: "dar-lumen",         univers: "immo",      marque: "Dar Lumen",           metier: "Immobilier de prestige",                lieu: "Casablanca",        metier_en: "Prestige real estate",                    lieu_en: "Casablanca" },
  { slug: "hotel-solenne",     univers: "immo",      marque: "Hôtel Solenne",       metier: "Hôtel face à l'Atlantique",             lieu: "Biarritz",          metier_en: "Hotel facing the Atlantic",               lieu_en: "Biarritz" },
  { slug: "riad-nouja",        univers: "immo",      marque: "Riad Nouja",          metier: "Maison d'hôtes dans la médina",         lieu: "Marrakech",         metier_en: "Guesthouse in the medina",                lieu_en: "Marrakech" },
  { slug: "clef-dazur",        univers: "immo",      marque: "Clef d'Azur",         metier: "Agence immobilière",                    lieu: "Nice",              metier_en: "Real estate agency",                      lieu_en: "Nice" },

  { slug: "saffra",            univers: "table",     marque: "Saffra",              metier: "Cuisine marocaine contemporaine",       lieu: "Marrakech",         metier_en: "Contemporary Moroccan cuisine",           lieu_en: "Marrakech" },
  { slug: "maison-zaffa",      univers: "table",     marque: "Maison Zaffa",        metier: "Traiteur de mariage",                   lieu: "Casablanca",        metier_en: "Wedding caterer",                         lieu_en: "Casablanca" },
  { slug: "grillon-burger",    univers: "table",     marque: "Grillon",             metier: "Smash burgers halal",                   lieu: "Lyon",              metier_en: "Halal smash burgers",                     lieu_en: "Lyon" },
  { slug: "lueur-events",      univers: "table",     marque: "Lueur",               metier: "Agence événementielle",                 lieu: "Paris",             metier_en: "Event agency",                            lieu_en: "Paris" },

  { slug: "orvane-dental",     univers: "sante",     marque: "Orvane Dental",       metier: "Dentisterie esthétique",                lieu: "Dubaï",             metier_en: "Cosmetic dentistry",                      lieu_en: "Dubai" },
  { slug: "alvea-dentaire",    univers: "sante",     marque: "Alvéa",               metier: "Cabinet dentaire",                      lieu: "Bruxelles",         metier_en: "Dental practice",                         lieu_en: "Brussels" },

  { slug: "lexaris-avocats",   univers: "services",  marque: "Lexaris",             metier: "Avocats d'affaires",                    lieu: "Paris",             metier_en: "Business lawyers",                        lieu_en: "Paris" },
  { slug: "chiffre-et-cap",    univers: "services",  marque: "Chiffre & Cap",       metier: "Expertise comptable",                   lieu: "",                  metier_en: "Chartered accountants",                   lieu_en: "" },
  { slug: "quittly",           univers: "services",  marque: "Quittly",             metier: "Devis et factures en ligne",            lieu: "Logiciel",          metier_en: "Online quotes and invoices",              lieu_en: "Software" },
  { slug: "rendezia",          univers: "services",  marque: "Rendezia",            metier: "Agenda en ligne des cabinets de soin",  lieu: "Logiciel",          metier_en: "Online calendar for care practices",      lieu_en: "Software" },

  { slug: "forja-club",        univers: "sport",     marque: "Forja Club",          metier: "Club de force premium",                 lieu: "",                  metier_en: "Premium strength club",                   lieu_en: "" },
  { slug: "kinetik-coaching",  univers: "sport",     marque: "Kinetik",             metier: "Coaching sportif en extérieur",         lieu: "",                  metier_en: "Outdoor personal coaching",               lieu_en: "" },

  { slug: "horizon-atlas",     univers: "education", marque: "École Horizon Atlas", metier: "École privée, de la maternelle au bac", lieu: "Rabat",             metier_en: "Private school, kindergarten to baccalaureate", lieu_en: "Rabat", marque_en: "Horizon Atlas School" },
  { slug: "creche-nuage",      univers: "education", marque: "Nuage",               metier: "Crèche bilingue",                       lieu: "",                  metier_en: "Bilingual nursery",                       lieu_en: "" }
];
