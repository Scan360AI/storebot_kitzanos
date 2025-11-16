// Brand database - 70+ brands configurati
// Importato da brands-config.js originale

export interface Brand {
  key: string;
  displayName: string;
  category: string;
  subcategory?: string;
  aliases: string[];
}

export const BRANDS: Brand[] = [
  // Shopping
  { key: 'zara', displayName: 'Zara', category: 'shopping', aliases: ['zara'] },
  { key: 'hm', displayName: 'H&M', category: 'shopping', aliases: ['h&m', 'hm', 'h & m'] },
  { key: 'mango', displayName: 'Mango', category: 'shopping', aliases: ['mango'] },
  { key: 'bershka', displayName: 'Bershka', category: 'shopping', aliases: ['bershka'] },
  { key: 'stradivarius', displayName: 'Stradivarius', category: 'shopping', aliases: ['stradivarius'] },
  { key: 'pull_bear', displayName: 'Pull & Bear', category: 'shopping', aliases: ['pull & bear', 'pull&bear'] },
  { key: 'oviesse', displayName: 'OVS', category: 'shopping', aliases: ['ovs', 'oviesse'] },
  { key: 'intimissimi', displayName: 'Intimissimi', category: 'shopping', aliases: ['intimissimi'] },
  { key: 'calzedonia', displayName: 'Calzedonia', category: 'shopping', aliases: ['calzedonia'] },
  { key: 'tezenis', displayName: 'Tezenis', category: 'shopping', aliases: ['tezenis'] },

  // Supermercati
  { key: 'esselunga', displayName: 'Esselunga', category: 'supermarket', aliases: ['esselunga'] },
  { key: 'carrefour', displayName: 'Carrefour', category: 'supermarket', aliases: ['carrefour'] },
  { key: 'conad', displayName: 'Conad', category: 'supermarket', aliases: ['conad'] },
  { key: 'coop', displayName: 'Coop', category: 'supermarket', aliases: ['coop'] },
  { key: 'lidl', displayName: 'Lidl', category: 'supermarket', aliases: ['lidl'] },
  { key: 'eurospin', displayName: 'Eurospin', category: 'supermarket', aliases: ['eurospin'] },
  { key: 'aldi', displayName: 'Aldi', category: 'supermarket', aliases: ['aldi'] },
  { key: 'pam', displayName: 'PAM', category: 'supermarket', aliases: ['pam'] },
  { key: 'despar', displayName: 'Despar', category: 'supermarket', aliases: ['despar'] },

  // Food & Beverage
  { key: 'mcdonalds', displayName: "McDonald's", category: 'food_beverage', aliases: ['mcdonald', 'mcdonalds', "mcdonald's"] },
  { key: 'kfc', displayName: 'KFC', category: 'food_beverage', aliases: ['kfc', 'kentucky'] },
  { key: 'burger_king', displayName: 'Burger King', category: 'food_beverage', aliases: ['burger king'] },
  { key: 'starbucks', displayName: 'Starbucks', category: 'food_beverage', aliases: ['starbucks'] },
  { key: 'subway', displayName: 'Subway', category: 'food_beverage', aliases: ['subway'] },
  { key: 'pizza_hut', displayName: 'Pizza Hut', category: 'food_beverage', aliases: ['pizza hut'] },
  { key: 'dominos', displayName: "Domino's Pizza", category: 'food_beverage', aliases: ['dominos', "domino's"] },
  { key: 'autogrill', displayName: 'Autogrill', category: 'food_beverage', aliases: ['autogrill'] },
  { key: 'rossopomodoro', displayName: 'Rossopomodoro', category: 'food_beverage', aliases: ['rossopomodoro'] },
  { key: 'spontini', displayName: 'Spontini', category: 'food_beverage', aliases: ['spontini'] },

  // Elettronica
  { key: 'mediaworld', displayName: 'MediaWorld', category: 'electronics', aliases: ['mediaworld', 'media world'] },
  { key: 'unieuro', displayName: 'Unieuro', category: 'electronics', aliases: ['unieuro'] },
  { key: 'euronics', displayName: 'Euronics', category: 'electronics', aliases: ['euronics'] },
  { key: 'expert', displayName: 'Expert', category: 'electronics', aliases: ['expert'] },
  { key: 'trony', displayName: 'Trony', category: 'electronics', aliases: ['trony'] },
  { key: 'apple_store', displayName: 'Apple Store', category: 'electronics', aliases: ['apple store', 'apple'] },

  // Sport
  { key: 'decathlon', displayName: 'Decathlon', category: 'sport', aliases: ['decathlon'] },
  { key: 'cisalfa', displayName: 'Cisalfa Sport', category: 'sport', aliases: ['cisalfa'] },
  { key: 'nike', displayName: 'Nike', category: 'sport', aliases: ['nike'] },
  { key: 'adidas', displayName: 'Adidas', category: 'sport', aliases: ['adidas'] },
  { key: 'foot_locker', displayName: 'Foot Locker', category: 'sport', aliases: ['foot locker', 'footlocker'] },

  // Casa e Bricolage
  { key: 'ikea', displayName: 'IKEA', category: 'home', aliases: ['ikea'] },
  { key: 'leroy_merlin', displayName: 'Leroy Merlin', category: 'home', aliases: ['leroy merlin', 'leroy'] },
  { key: 'bricoman', displayName: 'Bricoman', category: 'home', aliases: ['bricoman'] },
  { key: 'obi', displayName: 'OBI', category: 'home', aliases: ['obi'] },
  { key: 'maisons', displayName: 'Maisons du Monde', category: 'home', aliases: ['maisons du monde', 'maisons'] },

  // Farmacia e Salute
  { key: 'farmacity', displayName: 'Farmacity', category: 'pharmacy', aliases: ['farmacity'] },
  { key: 'lloyds', displayName: "Lloyds Farmacia", category: 'pharmacy', aliases: ['lloyds'] },

  // Beauty
  { key: 'sephora', displayName: 'Sephora', category: 'beauty', aliases: ['sephora'] },
  { key: 'kiko', displayName: 'Kiko', category: 'beauty', aliases: ['kiko'] },
  { key: 'douglas', displayName: 'Douglas', category: 'beauty', aliases: ['douglas'] },

  // Librerie e Cartoleria
  { key: 'feltrinelli', displayName: 'Feltrinelli', category: 'books', aliases: ['feltrinelli'] },
  { key: 'mondadori', displayName: 'Mondadori', category: 'books', aliases: ['mondadori'] },

  // Banche
  { key: 'intesa', displayName: 'Intesa Sanpaolo', category: 'bank', aliases: ['intesa sanpaolo', 'intesa'] },
  { key: 'unicredit', displayName: 'UniCredit', category: 'bank', aliases: ['unicredit'] },
  { key: 'bnl', displayName: 'BNL', category: 'bank', aliases: ['bnl'] },
  { key: 'poste', displayName: 'Poste Italiane', category: 'services', aliases: ['poste italiane', 'poste'] },
];

export const CATEGORIES = {
  shopping: 'Shopping',
  supermarket: 'Supermercati',
  food_beverage: 'Food & Beverage',
  electronics: 'Elettronica',
  sport: 'Sport',
  home: 'Casa e Bricolage',
  pharmacy: 'Farmacia',
  beauty: 'Beauty',
  books: 'Librerie',
  bank: 'Banche',
  services: 'Servizi',
};

export function findBrand(name: string): Brand | null {
  const normalized = name.toLowerCase().trim();

  return BRANDS.find((brand) =>
    brand.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
  ) || null;
}
