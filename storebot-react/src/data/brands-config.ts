// brands-config.ts - Database brand italiani per matching POI
// Convertito da brands-config.js originale

export interface BrandConfig {
  displayName: string;
  category: string;
  subCategory?: string;
  aliases?: string[];
}

export interface CategoryConfig {
  types: string[];
  icon: string;
  color: string;
}

// Categorie attrattori principali
export const CATEGORIES_CONFIG: Record<string, CategoryConfig> = {
  'Negozi e Shopping': {
    types: ['store', 'shopping_mall', 'clothing_store', 'electronics_store', 'department_store', 'shoe_store', 'jewelry_store', 'book_store', 'furniture_store', 'home_goods_store', 'convenience_store', 'hardware_store', 'pet_store', 'liquor_store', 'gift_store', 'toy_store', 'sporting_goods_store', 'bicycle_store', 'florist'],
    icon: '🛍️',
    color: '#e74c3c'
  },
  'Supermercati': {
    types: ['supermarket', 'grocery_or_supermarket'],
    icon: '🛒',
    color: '#27ae60'
  },
  'Servizi Pubblici e Banche': {
    types: ['bank', 'atm', 'post_office', 'police', 'fire_station', 'local_government_office', 'courthouse', 'embassy', 'city_hall', 'library'],
    icon: '🏛️',
    color: '#34495e'
  },
  'Trasporti': {
    types: ['transit_station', 'subway_station', 'train_station', 'bus_station', 'taxi_stand', 'parking', 'airport', 'light_rail_station', 'gas_station', 'car_rental', 'car_repair', 'car_wash'],
    icon: '🚇',
    color: '#3498db'
  },
  'Istruzione': {
    types: ['school', 'university', 'primary_school', 'secondary_school', 'preschool'],
    icon: '🎓',
    color: '#9b59b6'
  },
  'Salute e Benessere': {
    types: ['hospital', 'pharmacy', 'doctor', 'dentist', 'physiotherapist', 'gym', 'spa', 'beauty_salon', 'hair_care', 'veterinary_care', 'drugstore', 'optical_store'],
    icon: '🏥',
    color: '#e67e22'
  },
  'Ristorazione e Bar': {
    types: ['restaurant', 'meal_takeaway', 'cafe', 'bar', 'bakery', 'meal_delivery', 'food', 'night_club'],
    icon: '🍽️',
    color: '#f39c12'
  },
  'Tempo Libero e Cultura': {
    types: ['park', 'movie_theater', 'tourist_attraction', 'museum', 'art_gallery', 'stadium', 'zoo', 'amusement_park', 'bowling_alley', 'casino', 'campground', 'rv_park', 'aquarium', 'painter', 'travel_agency'],
    icon: '🎪',
    color: '#1abc9c'
  },
  'Alloggi': {
    types: ['lodging', 'hotel', 'motel'],
    icon: '🏨',
    color: '#7f8c8d'
  },
  'Bricolage e Giardinaggio': {
    types: ['hardware_store', 'home_goods_store', 'florist'],
    icon: '🛠️',
    color: '#8E44AD'
  }
};

// Database completo brand italiani
export const BRANDS_CONFIG: Record<string, BrandConfig> = {
  // SUPERMERCATI E DISCOUNT
  'spazio conad': { displayName: 'Spazio Conad', category: 'Supermercati', subCategory: 'Ipermercato', aliases: ['ipermercato conad'] },
  'conad superstore': { displayName: 'Conad Superstore', category: 'Supermercati', subCategory: 'Superstore' },
  'conad': { displayName: 'Conad', category: 'Supermercati', subCategory: 'Supermercato' },
  'conad city': { displayName: 'Conad City', category: 'Supermercati', subCategory: 'Superette/Prossimità' },
  'margherita conad': { displayName: 'Margherita Conad', category: 'Supermercati', subCategory: 'Superette/Prossimità' },
  'ipercoop': { displayName: 'Ipercoop', category: 'Supermercati', subCategory: 'Ipermercato', aliases: ['extracoop', 'centro coop'] },
  'coop': { displayName: 'Coop', category: 'Supermercati', subCategory: 'Supermercato', aliases: ['coop fi', 'coop alleanza', 'nova coop', 'supermercato coop'] },
  'esselunga': { displayName: 'Esselunga', category: 'Supermercati', subCategory: 'Supermercato' },
  'carrefour iper': { displayName: 'Carrefour Iper', category: 'Supermercati', subCategory: 'Ipermercato', aliases: ['ipermercato carrefour'] },
  'carrefour market': { displayName: 'Carrefour Market', category: 'Supermercati', subCategory: 'Supermercato' },
  'carrefour express': { displayName: 'Carrefour Express', category: 'Supermercati', subCategory: 'Prossimità/Superette', aliases: ['carrefour city'] },
  'famila': { displayName: 'Famila', category: 'Supermercati', subCategory: 'Supermercato/Superstore', aliases: ['famila market', 'iperfamila'] },
  'despar': { displayName: 'Despar', category: 'Supermercati', subCategory: 'Prossimità/Superette' },
  'eurospar': { displayName: 'Eurospar', category: 'Supermercati', subCategory: 'Supermercato' },
  'interspar': { displayName: 'Interspar', category: 'Supermercati', subCategory: 'Ipermercato' },
  'pam': { displayName: 'Pam', category: 'Supermercati', subCategory: 'Supermercato' },
  'pam local': { displayName: 'Pam Local', category: 'Supermercati', subCategory: 'City/Prossimità' },
  'crai': { displayName: 'CRAI', category: 'Supermercati', subCategory: 'Supermercato', aliases: ['crai supermercato'] },
  'sigma': { displayName: 'Sigma', category: 'Supermercati', subCategory: 'Supermercato', aliases: ['sigma market'] },
  'iper la grande i': { displayName: 'Iper La grande i', category: 'Supermercati', subCategory: 'Ipermercato', aliases: ['iper', 'la grande i'] },
  'bennet': { displayName: 'Bennet', category: 'Supermercati', subCategory: 'Ipermercato/Supermercato' },
  'eurospin': { displayName: 'Eurospin', category: 'Supermercati', subCategory: 'Discount', aliases: ['euro spin'] },
  'lidl': { displayName: 'Lidl', category: 'Supermercati', subCategory: 'Discount', aliases: ['lidl italia'] },
  'md': { displayName: 'MD', category: 'Supermercati', subCategory: 'Discount', aliases: ['md spa', 'ld market'] },
  'aldi': { displayName: 'ALDI', category: 'Supermercati', subCategory: 'Discount', aliases: ['aldi italia'] },
  'penny market': { displayName: 'PENNY Market', category: 'Supermercati', subCategory: 'Discount', aliases: ['penny'] },
  'todis': { displayName: 'Todis', category: 'Supermercati', subCategory: 'Discount' },
  'ins mercato': { displayName: 'IN\'s Mercato', category: 'Supermercati', subCategory: 'Discount', aliases: ['ins', 'in s'] },
  'unes': { displayName: 'Unes Supermercati', category: 'Supermercati', subCategory: 'Supermercato', aliases: ['u! come tu mi vuoi', 'u2 supermercato'] },
  'tigros': { displayName: 'Tigros', category: 'Supermercati', subCategory: 'Superstore/Supermercato' },
  'ali': { displayName: 'Alì', category: 'Supermercati', subCategory: 'Supermercato', aliases: ['ali supermercati', 'aliper'] },
  'iperal': { displayName: 'Iperal', category: 'Supermercati', subCategory: 'Ipermercato/Supermercato' },
  'super tosano': { displayName: 'Super Tosano', category: 'Supermercati', subCategory: 'IperDiscount', aliases: ['tosano'] },
  'migross': { displayName: 'Migross', category: 'Supermercati', subCategory: 'Superstore/Supermercato' },

  // ABBIGLIAMENTO
  'benetton': { displayName: 'Benetton', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Casual' },
  'calzedonia': { displayName: 'Calzedonia', category: 'Negozi e Shopping', subCategory: 'Calzetteria e Beachwear' },
  'intimissimi': { displayName: 'Intimissimi', category: 'Negozi e Shopping', subCategory: 'Intimo e Homewear' },
  'tezenis': { displayName: 'Tezenis', category: 'Negozi e Shopping', subCategory: 'Intimo e Homewear Young' },
  'falconeri': { displayName: 'Falconeri', category: 'Negozi e Shopping', subCategory: 'Maglieria Cashmere' },
  'gucci': { displayName: 'Gucci', category: 'Negozi e Shopping', subCategory: 'Moda Lusso' },
  'armani': { displayName: 'Giorgio Armani', category: 'Negozi e Shopping', subCategory: 'Moda Lusso', aliases: ['giorgio armani', 'emporio armani', 'armani exchange', 'ea7'] },
  'versace': { displayName: 'Versace', category: 'Negozi e Shopping', subCategory: 'Moda Lusso', aliases: ['gianni versace'] },
  'prada': { displayName: 'Prada', category: 'Negozi e Shopping', subCategory: 'Moda Lusso' },
  'fendi': { displayName: 'Fendi', category: 'Negozi e Shopping', subCategory: 'Moda Lusso' },
  'moncler': { displayName: 'Moncler', category: 'Negozi e Shopping', subCategory: 'Piumini e Outerwear Lusso' },
  'liu jo': { displayName: 'Liu Jo', category: 'Negozi e Shopping', subCategory: 'Abbigliamento e Accessori Donna', aliases: ['liujo'] },
  'patrizia pepe': { displayName: 'Patrizia Pepe', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Donna Glamour' },
  'pinko': { displayName: 'Pinko', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Donna Fashion' },
  'ovs': { displayName: 'OVS', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Fast Fashion' },
  'upim': { displayName: 'Upim', category: 'Negozi e Shopping', subCategory: 'Abbigliamento e Casa Low Cost' },
  'terranova': { displayName: 'Terranova', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Fast Fashion' },
  'piazza italia': { displayName: 'Piazza Italia', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Famiglia Fast Fashion' },
  'motivi': { displayName: 'Motivi', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Donna Giovane' },
  'oltre': { displayName: 'Oltre', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Donna' },
  'sisley': { displayName: 'Sisley', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Giovane Fashion' },
  'diesel': { displayName: 'Diesel', category: 'Negozi e Shopping', subCategory: 'Jeanswear e Casual' },
  'replay': { displayName: 'Replay', category: 'Negozi e Shopping', subCategory: 'Jeanswear' },
  'gas jeans': { displayName: 'Gas Jeans', category: 'Negozi e Shopping', subCategory: 'Jeanswear', aliases: ['gas'] },
  'geox': { displayName: 'Geox', category: 'Negozi e Shopping', subCategory: 'Calzature e Abbigliamento' },
  'furla': { displayName: 'Furla', category: 'Negozi e Shopping', subCategory: 'Borse e Accessori' },
  'coccinelle': { displayName: 'Coccinelle', category: 'Negozi e Shopping', subCategory: 'Borse e Accessori Donna' },
  'yamamay': { displayName: 'Yamamay', category: 'Negozi e Shopping', subCategory: 'Intimo e Beachwear' },
  'freddy': { displayName: 'Freddy', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Fitness/Danza' },
  'stone island': { displayName: 'Stone Island', category: 'Negozi e Shopping', subCategory: 'Outerwear Tecnico Uomo' },
  'napapijri': { displayName: 'Napapijri', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Outdoor/Casual' },
  'peuterey': { displayName: 'Peuterey', category: 'Negozi e Shopping', subCategory: 'Outerwear/Piumini' },
  'colmar': { displayName: 'Colmar', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Sci/Sportivo' },
  'k way': { displayName: 'K-Way', category: 'Negozi e Shopping', subCategory: 'Outerwear Impermeabile', aliases: ['kway'] },
  'chicco': { displayName: 'Chicco', category: 'Negozi e Shopping', subCategory: 'Prodotti Infanzia', aliases: ['negozio chicco'] },
  'prenatal': { displayName: 'Prénatal', category: 'Negozi e Shopping', subCategory: 'Prodotti Infanzia e Maternità' },
  'brums': { displayName: 'Brums', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Bambini' },
  'harmont & blaine': { displayName: 'Harmont & Blaine', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Casual Uomo', aliases: ['harmont and blaine'] },
  'boggi milano': { displayName: 'Boggi Milano', category: 'Negozi e Shopping', subCategory: 'Abbigliamento Uomo', aliases: ['boggi'] },
  'camicissima': { displayName: 'Camicissima', category: 'Negozi e Shopping', subCategory: 'Camiceria' },

  // RISTORAZIONE
  'mcdonalds': { displayName: 'McDonald\'s', category: 'Ristorazione e Bar', subCategory: 'Fast Food', aliases: ['mc donalds', 'mcdrive', 'mc cafe', 'mc'] },
  'burger king': { displayName: 'Burger King', category: 'Ristorazione e Bar', subCategory: 'Fast Food' },
  'kfc': { displayName: 'KFC', category: 'Ristorazione e Bar', subCategory: 'Fast Food', aliases: ['kentucky fried chicken'] },
  'five guys': { displayName: 'Five Guys', category: 'Ristorazione e Bar', subCategory: 'Fast Food Burger' },
  'old wild west': { displayName: 'Old Wild West', category: 'Ristorazione e Bar', subCategory: 'Steakhouse Tex-Mex' },
  'roadhouse grill': { displayName: 'Roadhouse Grill', category: 'Ristorazione e Bar', subCategory: 'Steakhouse' },
  'america graffiti': { displayName: 'America Graffiti', category: 'Ristorazione e Bar', subCategory: 'Diner Americano' },
  'doppio malto': { displayName: 'Doppio Malto', category: 'Ristorazione e Bar', subCategory: 'Birrificio e Cucina' },
  'alice pizza': { displayName: 'Alice Pizza', category: 'Ristorazione e Bar', subCategory: 'Pizza al Taglio' },
  'spontini': { displayName: 'Spontini', category: 'Ristorazione e Bar', subCategory: 'Pizza al Trancio' },
  'rossopomodoro': { displayName: 'Rossopomodoro', category: 'Ristorazione e Bar', subCategory: 'Pizza Napoletana' },
  'la piadineria': { displayName: 'La Piadineria', category: 'Ristorazione e Bar', subCategory: 'Piadineria' },
  'autogrill': { displayName: 'Autogrill', category: 'Ristorazione e Bar', subCategory: 'Ristorazione Autostradale' },
  'chef express': { displayName: 'Chef Express', category: 'Ristorazione e Bar', subCategory: 'Ristorazione Stazioni' },
  'starbucks': { displayName: 'Starbucks', category: 'Ristorazione e Bar', subCategory: 'Coffee Shop' },
  'arnold coffee': { displayName: 'Arnold Coffee', category: 'Ristorazione e Bar', subCategory: 'Coffee Shop' },
  'grom': { displayName: 'Grom Gelato', category: 'Ristorazione e Bar', subCategory: 'Gelateria', aliases: ['grom gelato'] },
  'venchi': { displayName: 'Venchi', category: 'Ristorazione e Bar', subCategory: 'Cioccolateria e Gelateria', aliases: ['venchi chocogelateria'] },
  'cioccolatitaliani': { displayName: 'CioccolatItaliani', category: 'Ristorazione e Bar', subCategory: 'Cioccolateria e Gelateria' },
  'poke house': { displayName: 'Poke House', category: 'Ristorazione e Bar', subCategory: 'Poke Bowl' },
  'i love poke': { displayName: 'I Love Poke', category: 'Ristorazione e Bar', subCategory: 'Poke Bowl' },
  'miscusi': { displayName: 'Miscusi', category: 'Ristorazione e Bar', subCategory: 'Pasta Fresca' },
  'pescaria': { displayName: 'Pescaria', category: 'Ristorazione e Bar', subCategory: 'Pesce Street Food' },
  'flower burger': { displayName: 'Flower Burger', category: 'Ristorazione e Bar', subCategory: 'Burger Vegano' },
  'temakinho': { displayName: 'Temakinho', category: 'Ristorazione e Bar', subCategory: 'Sushi Brasiliano' },
  'wagamama': { displayName: 'Wagamama', category: 'Ristorazione e Bar', subCategory: 'Asian Fusion' },
  'hard rock cafe': { displayName: 'Hard Rock Café', category: 'Ristorazione e Bar', subCategory: 'American Restaurant' },
  'vapiano': { displayName: 'Vapiano', category: 'Ristorazione e Bar', subCategory: 'Pasta e Pizza Fresh' },

  // ELETTRONICA
  'mediaworld': { displayName: 'MediaWorld', category: 'Negozi e Shopping', subCategory: 'Elettronica di Consumo' },
  'unieuro': { displayName: 'Unieuro', category: 'Negozi e Shopping', subCategory: 'Elettronica di Consumo' },
  'euronics': { displayName: 'Euronics', category: 'Negozi e Shopping', subCategory: 'Elettronica di Consumo' },
  'expert': { displayName: 'Expert', category: 'Negozi e Shopping', subCategory: 'Elettronica di Consumo' },
  'trony': { displayName: 'Trony', category: 'Negozi e Shopping', subCategory: 'Elettronica di Consumo' },
  'tim store': { displayName: 'TIM Store', category: 'Negozi e Shopping', subCategory: 'Telefonia Mobile e Fissa', aliases: ['tim', 'negozio tim'] },
  'vodafone store': { displayName: 'Vodafone Store', category: 'Negozi e Shopping', subCategory: 'Telefonia Mobile', aliases: ['vodafone'] },
  'windtre store': { displayName: 'WindTre Store', category: 'Negozi e Shopping', subCategory: 'Telefonia Mobile', aliases: ['wind tre', 'wind 3'] },
  'iliad store': { displayName: 'Iliad Store', category: 'Negozi e Shopping', subCategory: 'Telefonia Mobile', aliases: ['iliad'] },
  'apple store': { displayName: 'Apple Store', category: 'Negozi e Shopping', subCategory: 'Brand Store Apple' },
  'samsung experience store': { displayName: 'Samsung Experience Store', category: 'Negozi e Shopping', subCategory: 'Brand Store Samsung' },
  'xiaomi store': { displayName: 'Xiaomi Store', category: 'Negozi e Shopping', subCategory: 'Brand Store Xiaomi' },
  'gamestop': { displayName: 'GameStop', category: 'Negozi e Shopping', subCategory: 'Videogiochi' },
  'iriparo': { displayName: 'iRiparo', category: 'Negozi e Shopping', subCategory: 'Riparazione Smartphone/Tablet' },

  // BEAUTY & SALUTE
  'sephora': { displayName: 'Sephora', category: 'Salute e Benessere', subCategory: 'Profumeria' },
  'douglas': { displayName: 'Douglas Profumerie', category: 'Salute e Benessere', subCategory: 'Profumeria', aliases: ['douglas profumerie'] },
  'marionnaud': { displayName: 'Marionnaud', category: 'Salute e Benessere', subCategory: 'Profumeria' },
  'limoni': { displayName: 'Limoni', category: 'Salute e Benessere', subCategory: 'Profumeria' },
  'la gardenia': { displayName: 'La Gardenia', category: 'Salute e Benessere', subCategory: 'Profumeria' },
  'kiko': { displayName: 'KIKO Milano', category: 'Salute e Benessere', subCategory: 'Make-up Store', aliases: ['kiko milano'] },
  'wycon': { displayName: 'Wycon Cosmetics', category: 'Salute e Benessere', subCategory: 'Make-up Store', aliases: ['wycon cosmetics'] },
  'lush': { displayName: 'Lush', category: 'Salute e Benessere', subCategory: 'Cosmesi Naturale', aliases: ['lush fresh handmade'] },
  'loccitane': { displayName: 'L\'Occitane en Provence', category: 'Salute e Benessere', subCategory: 'Cosmesi Naturale', aliases: ['loccitane'] },
  'the body shop': { displayName: 'The Body Shop', category: 'Salute e Benessere', subCategory: 'Cosmesi Naturale' },
  'rituals': { displayName: 'Rituals Cosmetics', category: 'Salute e Benessere', subCategory: 'Cosmesi e Benessere', aliases: ['rituals cosmetics'] },
  'yves rocher': { displayName: 'Yves Rocher', category: 'Salute e Benessere', subCategory: 'Cosmesi Naturale' },
  'lerbolario': { displayName: 'L\'Erbolario', category: 'Salute e Benessere', subCategory: 'Cosmesi Naturale' },
  'bottega verde': { displayName: 'Bottega Verde', category: 'Salute e Benessere', subCategory: 'Cosmesi Naturale' },
  'tigota': { displayName: 'Tigotà', category: 'Salute e Benessere', subCategory: 'Drugstore Igiene Casa' },
  'acqua e sapone': { displayName: 'Acqua & Sapone', category: 'Salute e Benessere', subCategory: 'Drugstore Igiene Casa', aliases: ['acqua sapone', 'acqua & sapone'] },
  'dm': { displayName: 'dm-drogerie markt Italia', category: 'Salute e Benessere', subCategory: 'Drugstore', aliases: ['dm drogerie markt', 'dm italia'] },
  'jean louis david': { displayName: 'Jean Louis David', category: 'Salute e Benessere', subCategory: 'Parrucchiere' },
  'aldo coppola': { displayName: 'Aldo Coppola', category: 'Salute e Benessere', subCategory: 'Parrucchiere' },
  'barberinos': { displayName: 'Barberino\'s', category: 'Salute e Benessere', subCategory: 'Barbiere' },
  'salmoiraghi vigano': { displayName: 'Salmoiraghi & Viganò', category: 'Salute e Benessere', subCategory: 'Ottica', aliases: ['salmoiraghi e vigano'] },
  'grandvision': { displayName: 'GrandVision', category: 'Salute e Benessere', subCategory: 'Ottica', aliases: ['vistasi', 'avanzi'] },
  'fielmann': { displayName: 'Fielmann', category: 'Salute e Benessere', subCategory: 'Ottica' },
  'amplifon': { displayName: 'Amplifon', category: 'Salute e Benessere', subCategory: 'Centro Acustico' },
  'dentalpro': { displayName: 'DentalPro', category: 'Salute e Benessere', subCategory: 'Clinica Dentale' },
  'vitaldent': { displayName: 'Vitaldent', category: 'Salute e Benessere', subCategory: 'Clinica Dentale' },

  // FITNESS
  'virgin active': { displayName: 'Virgin Active', category: 'Salute e Benessere', subCategory: 'Fitness Club Premium' },
  'mcfit': { displayName: 'McFIT', category: 'Salute e Benessere', subCategory: 'Fitness Low Cost' },
  'basic fit': { displayName: 'Basic-Fit', category: 'Salute e Benessere', subCategory: 'Fitness Low Cost', aliases: ['basic-fit'] },
  'anytime fitness': { displayName: 'Anytime Fitness', category: 'Salute e Benessere', subCategory: 'Fitness 24h' },
  'fitactive': { displayName: 'FitActive', category: 'Salute e Benessere', subCategory: 'Fitness Club' },
  'qc terme': { displayName: 'QC Terme', category: 'Salute e Benessere', subCategory: 'Centro Benessere e Termale' },

  // SPORT & OUTDOOR
  'decathlon': { displayName: 'Decathlon', category: 'Negozi e Shopping', subCategory: 'Sport Multimarca' },
  'cisalfa sport': { displayName: 'Cisalfa Sport', category: 'Negozi e Shopping', subCategory: 'Sport Multimarca' },
  'intersport': { displayName: 'Intersport', category: 'Negozi e Shopping', subCategory: 'Sport Multimarca' },
  'jd sports': { displayName: 'JD Sports', category: 'Negozi e Shopping', subCategory: 'Sportswear Urban' },
  'foot locker': { displayName: 'Foot Locker', category: 'Negozi e Shopping', subCategory: 'Sneakers e Sportswear' },
  'aw lab': { displayName: 'AW LAB', category: 'Negozi e Shopping', subCategory: 'Sneakers e Streetwear' },
  'nike store': { displayName: 'Nike Store', category: 'Negozi e Shopping', subCategory: 'Sportswear Monobrand' },
  'adidas store': { displayName: 'Adidas Store', category: 'Negozi e Shopping', subCategory: 'Sportswear Monobrand', aliases: ['adidas originals'] },
  'the north face': { displayName: 'The North Face Store', category: 'Negozi e Shopping', subCategory: 'Outdoor Abbigliamento' },
  'vans store': { displayName: 'Vans Store', category: 'Negozi e Shopping', subCategory: 'Skatewear' },

  // BRICOLAGE & GIARDINAGGIO
  'leroy merlin': { displayName: 'Leroy Merlin', category: 'Bricolage e Giardinaggio', subCategory: 'Bricolage, Edilizia, Giardinaggio, Casa' },
  'bricoman': { displayName: 'Bricoman', category: 'Bricolage e Giardinaggio', subCategory: 'Bricolage Professionale', aliases: ['tecnomat'] },
  'bricofer': { displayName: 'Bricofer', category: 'Bricolage e Giardinaggio', subCategory: 'Bricolage' },
  'bricocenter': { displayName: 'Bricocenter', category: 'Bricolage e Giardinaggio', subCategory: 'Bricolage' },
  'obi': { displayName: 'Obi', category: 'Bricolage e Giardinaggio', subCategory: 'Bricolage e Giardinaggio' },
  'brico io': { displayName: 'Brico Io', category: 'Bricolage e Giardinaggio', subCategory: 'Bricolage' },
  'viridea': { displayName: 'Viridea Garden Center', category: 'Bricolage e Giardinaggio', subCategory: 'Giardinaggio, Animali, Casa', aliases: ['viridea garden center'] },

  // PET
  'arcaplanet': { displayName: 'Arcaplanet', category: 'Negozi e Shopping', subCategory: 'Prodotti Animali' },
  'isola dei tesori': { displayName: 'Isola dei Tesori', category: 'Negozi e Shopping', subCategory: 'Prodotti Animali' },
  'maxi zoo': { displayName: 'Maxi Zoo Italia', category: 'Negozi e Shopping', subCategory: 'Prodotti Animali' },

  // ARREDAMENTO
  'ikea': { displayName: 'IKEA', category: 'Negozi e Shopping', subCategory: 'Arredamento e Accessori Casa' },
  'mondo convenienza': { displayName: 'Mondo Convenienza', category: 'Negozi e Shopping', subCategory: 'Arredamento Low Cost' },
  'maisons du monde': { displayName: 'Maisons du Monde', category: 'Negozi e Shopping', subCategory: 'Arredamento e Decorazione' },
  'poltronesofa': { displayName: 'Poltronesofà', category: 'Negozi e Shopping', subCategory: 'Divani e Poltrone' },
  'scavolini': { displayName: 'Scavolini', category: 'Negozi e Shopping', subCategory: 'Cucine', aliases: ['scavolini store'] },
  'veneta cucine': { displayName: 'Veneta Cucine', category: 'Negozi e Shopping', subCategory: 'Cucine' },
  'iperceramica': { displayName: 'Iperceramica', category: 'Negozi e Shopping', subCategory: 'Pavimenti e Rivestimenti' },
  'kasanova': { displayName: 'Kasanova', category: 'Negozi e Shopping', subCategory: 'Articoli per la Casa e Regali' },
  'zara home': { displayName: 'Zara Home', category: 'Negozi e Shopping', subCategory: 'Tessile e Decor Casa' },
  'flying tiger': { displayName: 'Flying Tiger Copenhagen', category: 'Negozi e Shopping', subCategory: 'Oggettistica e Regalo' },
  'thun': { displayName: 'Thun Shop', category: 'Negozi e Shopping', subCategory: 'Ceramiche e Regalo', aliases: ['thun shop', 'thun casa'] },

  // BANCHE E SERVIZI FINANZIARI
  'intesa sanpaolo': { displayName: 'Intesa Sanpaolo', category: 'Servizi Pubblici e Banche', subCategory: 'Banca' },
  'unicredit': { displayName: 'UniCredit', category: 'Servizi Pubblici e Banche', subCategory: 'Banca' },
  'banco bpm': { displayName: 'Banco BPM', category: 'Servizi Pubblici e Banche', subCategory: 'Banca' },
  'bper banca': { displayName: 'BPER Banca', category: 'Servizi Pubblici e Banche', subCategory: 'Banca' },
  'bnl': { displayName: 'BNL BNP Paribas', category: 'Servizi Pubblici e Banche', subCategory: 'Banca', aliases: ['bnl bnp paribas'] },
  'poste italiane': { displayName: 'Poste Italiane', category: 'Servizi Pubblici e Banche', subCategory: 'Servizi Postali e Finanziari', aliases: ['ufficio postale', 'posta'] },
  'generali': { displayName: 'Generali Italia', category: 'Servizi Pubblici e Banche', subCategory: 'Assicurazioni', aliases: ['generali italia'] },
  'allianz': { displayName: 'Allianz Assicurazioni', category: 'Servizi Pubblici e Banche', subCategory: 'Assicurazioni', aliases: ['allianz assicurazioni'] },
  'unipolsai': { displayName: 'UnipolSai', category: 'Servizi Pubblici e Banche', subCategory: 'Assicurazioni' },

  // SPEDIZIONI
  'mail boxes etc': { displayName: 'Mail Boxes Etc.', category: 'Servizi Pubblici e Banche', subCategory: 'Spedizioni e Servizi', aliases: ['mbe'] },
  'dhl': { displayName: 'DHL ServicePoint', category: 'Servizi Pubblici e Banche', subCategory: 'Spedizioni Express', aliases: ['dhl servicepoint'] },
  'ups': { displayName: 'UPS Access Point', category: 'Servizi Pubblici e Banche', subCategory: 'Punto Ritiro UPS', aliases: ['ups access point'] },
  'fedex': { displayName: 'FedEx', category: 'Servizi Pubblici e Banche', subCategory: 'Spedizioni Express', aliases: ['fedex tnt center', 'tnt'] },

  // VIAGGI
  'bluvacanze': { displayName: 'Bluvacanze', category: 'Tempo Libero e Cultura', subCategory: 'Agenzia Viaggi' },
  'gattinoni': { displayName: 'Gattinoni Mondo di Vacanze', category: 'Tempo Libero e Cultura', subCategory: 'Agenzia Viaggi', aliases: ['gattinoni mondo di vacanze'] },
  'alpitour': { displayName: 'Alpitour World', category: 'Tempo Libero e Cultura', subCategory: 'Tour Operator', aliases: ['alpitour world'] },

  // LAVANDERIE E SERVIZI
  'mister minit': { displayName: 'Mister Minit', category: 'Servizi Pubblici e Banche', subCategory: 'Riparazioni e Chiavi' },
  'prink': { displayName: 'Prink', category: 'Servizi Pubblici e Banche', subCategory: 'Centro Stampa' },
  'speed queen': { displayName: 'Speed Queen Self-Service', category: 'Servizi Pubblici e Banche', subCategory: 'Lavanderia Self' }
};

export default { BRANDS_CONFIG, CATEGORIES_CONFIG };
