// brand-database.js - Database delle preferenze dei brand per il matching
// Generato dal CSV brand_asset_preferences_37brands.csv

const BRAND_DATABASE = [
  {
    "name": "MAC",
    "description": "M·A·C Cosmetics, parte di Estée Lauder Cos., è un brand di make‑up professionale. Presidia travel retail, boutique high‑street e corner department store; core target beauty‑premium con forte traffico turistico.",
    "requirements": {
      "contractTypes": ["LEASE", "CONCESSION"],
      "positions": ["HIGH_STREET", "TRAVEL_RETAIL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 25, "max": 120 },
      "shopWindows": { "min": 4 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["cluster_beauty_premium", "high_tourist_flow", "airport_or_major_TPL_hub"],
      "notes": "Make-up bar integrato; facciata illuminata ≥4 m"
    }
  },
  {
    "name": "Maisons du Monde",
    "description": "Retailer francese di arredo e décor mid‑market; format city‑store 300‑900 m² e retail‑park 1 200‑1 500 m², assortimento "mix & match" e frequente rotazione collezioni.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["RETAIL_PARK", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 300, "max": 1500 },
      "shopWindows": { "min": 3 },
      "divisible": true,
      "height": { "min": 4.5 },
      "parkingSlots": { "min": 200 },
      "floorsAllowed": null,
      "attractors": ["home_improvement_anchor", "catchment_pop_≥150k", "easy_weekend_car_access"],
      "notes": "Frontage ≥15 m; magazzino ≈10 % GLA"
    }
  },
  {
    "name": "Maison Margiela",
    "description": "Maison Margiela è una casa di moda luxury avant‑garde del gruppo OTB. Predilige flagship 250‑400 m² in quartieri del lusso, concept white‑box e spazi per installazioni artistiche.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 250, "max": 400 },
      "shopWindows": { "min": 0 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": 2,
      "attractors": ["luxury_brand_cluster", "fashion_tourism", "cultural_quarter"],
      "notes": "Concept "white‑box"; possibile bar/café interno"
    }
  },
  {
    "name": "Mangano",
    "description": "Mangano è un brand femminile contemporaneo (Gruppo Antress); punta su piccole boutique 60‑150 m² in vie shopping o corner department store.",
    "requirements": {
      "contractTypes": ["LEASE", "CONCESSION"],
      "positions": ["HIGH_STREET", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 60, "max": 150 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["female_shopper_profile", "premium_mid_fashion_cluster"],
      "notes": ""
    }
  },
  {
    "name": "Mango",
    "description": "Mango è un retailer fast‑fashion spagnolo per donna e uomo; store 150‑800 m² high‑street/centri commerciali, target mass‑market 25‑45 anni.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 150, "max": 800 },
      "shopWindows": { "min": 4 },
      "divisible": false,
      "height": { "min": 3.5 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["fast_fashion_cluster", "high_footfall", "mass_market_demographics"],
      "notes": "Preferred corner location; facciata aperta"
    }
  },
  {
    "name": "Marciano",
    "description": "Marciano (Guess) propone luxury contemporary per donna. Cerca boutique 100‑200 m² in vie premium o mall di fascia alta.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 100, "max": 200 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["premium_fashion_cluster", "affluent_consumers"],
      "notes": ""
    }
  },
  {
    "name": "Marina Rinaldi",
    "description": "Marina Rinaldi, parte del Gruppo Max Mara, è leader nel segmento curvy‑fashion premium. Boutique 120‑250 m² in high‑street o mall di prestigio.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 120, "max": 250 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["premium_fashion_cluster", "mature_female_shoppers"],
      "notes": "Servizio sartoriale in‑store"
    }
  },
  {
    "name": "Massimo Dutti",
    "description": "Massimo Dutti (Inditex) offre moda contemporary‑classic uomo/donna. Store 300‑700 m² in prime high‑street o mall selezionati.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 300, "max": 700 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 4 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["premium_mid_fashion", "professional_demographics", "urban_elite"],
      "notes": "Concept store con materiali naturali"
    }
  },
  {
    "name": "Mayoral",
    "description": "Mayoral, brand spagnolo childrenswear 0‑16 anni, gestisce boutique 100‑250 m² in vie shopping e centri commerciali family‑oriented.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 100, "max": 250 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["family_target", "children_retail_cluster", "residential_proximity"],
      "notes": "Area gioco interna"
    }
  },
  {
    "name": "Max Casa",
    "description": "Max Casa è retailer bazar‑casalinghi low‑cost. Format 300‑800 m² in zone commerciali secondarie o retail park.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["RETAIL_PARK", "PERIPHERAL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 300, "max": 800 },
      "shopWindows": { "min": 2 },
      "divisible": true,
      "height": { "min": 0 },
      "parkingSlots": { "min": 50 },
      "floorsAllowed": null,
      "attractors": ["value_retail_cluster", "car_accessibility", "residential_area"],
      "notes": "Carico/scarico facilitato"
    }
  },
  {
    "name": "MaxMara",
    "description": "Max Mara, icona del prêt‑à‑porter femminile italiano. Flagship 300‑500 m² e boutique 150‑300 m² in prime high‑street internazionali.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 150, "max": 500 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 3.5 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": 2,
      "attractors": ["luxury_fashion_district", "international_shoppers", "affluent_female_35+"],
      "notes": "VIP lounge per personal shopping"
    }
  },
  {
    "name": "MCS",
    "description": "MCS (Marlboro Classics) offre abbigliamento casual‑outdoor uomo. Store 100‑250 m² in vie shopping e centri commerciali mainstream.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 100, "max": 250 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["male_fashion_cluster", "mid_market_positioning"],
      "notes": ""
    }
  },
  {
    "name": "McDonald's",
    "description": "McDonald's è la principale catena QSR globale; ricerca terreni o lotti in retail‑park o aree ad alto traffico automobilistico per ristoranti con drive‑thru.",
    "requirements": {
      "contractTypes": ["BUY"],
      "positions": ["URBAN", "PERIPHERAL", "RETAIL_PARK"],
      "type": "PLOT_OF_LAND",
      "gla": { "min": 0, "max": 9999 },
      "shopWindows": { "min": 0 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 25 },
      "floorsAllowed": null,
      "attractors": ["drive_thru", "high_car_flow", "family_demographics", "highway_proximity"],
      "notes": "Preferisce lotti ~2.500‑4.000 m² con parcheggio e corsia drive‑thru; eventuale building standard 400‑500 m²."
    }
  },
  {
    "name": "MD",
    "description": "MD è hard‑discount alimentare italiano con ~820 punti vendita. Cerca immobili 600‑1.200 m² con parcheggio in zone residenziali o di passaggio.",
    "requirements": {
      "contractTypes": ["LEASE", "BUY"],
      "positions": ["URBAN", "PERIPHERAL", "RETAIL_PARK"],
      "type": "SHOP_SPACE",
      "gla": { "min": 600, "max": 1200 },
      "shopWindows": { "min": 0 },
      "divisible": false,
      "height": { "min": 4 },
      "parkingSlots": { "min": 40 },
      "floorsAllowed": null,
      "attractors": ["residential_density", "price_sensitive_consumers", "car_accessibility"],
      "notes": "Piano terra; zona carico dedicata"
    }
  },
  {
    "name": "Media World",
    "description": "MediaWorld (MediaMarktSaturn) è leader elettronica di consumo. Megastore 2.000‑7.000 m² in retail park o centri commerciali regionali.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["RETAIL_PARK", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 2000, "max": 7000 },
      "shopWindows": { "min": 0 },
      "divisible": false,
      "height": { "min": 6 },
      "parkingSlots": { "min": 200 },
      "floorsAllowed": null,
      "attractors": ["retail_park_anchor", "catchment_area_200k+", "competitor_absence"],
      "notes": "Magazzino integrato; accesso merci dedicato"
    }
  },
  {
    "name": "Michael Kors",
    "description": "Michael Kors, luxury lifestyle americano. Store 150‑400 m² in high‑street premium e top mall; target aspirational luxury.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "TRAVEL_RETAIL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 150, "max": 400 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 3.5 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["premium_fashion_zone", "tourist_flow", "affluent_catchment"],
      "notes": "Corner location preferita"
    }
  },
  {
    "name": "Missoni",
    "description": "Missoni, maison italiana luxury knitwear e lifestyle. Boutique 200‑350 m² in vie del lusso e resort destination.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 200, "max": 350 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["luxury_fashion_district", "resort_destination", "art_cultural_quarter"],
      "notes": "Display arte/design integrato"
    }
  },
  {
    "name": "Miu Miu",
    "description": "Miu Miu (Prada Group) incarna luxury playful per giovani donne. Boutique 150‑300 m² in top luxury street e department store premium.",
    "requirements": {
      "contractTypes": ["LEASE", "CONCESSION"],
      "positions": ["HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 150, "max": 300 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 3.5 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["ultra_luxury_cluster", "young_affluent_shoppers", "fashion_capital"],
      "notes": "Concept avant‑garde; eventi esclusivi"
    }
  },
  {
    "name": "Mohito",
    "description": "Mohito (LPP) è fast‑fashion polacco young‑female. Store 400‑1.000 m² in centri commerciali e high‑street mass‑market.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["MALL", "HIGH_STREET", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 400, "max": 1000 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 3.5 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["young_female_target", "value_fashion_cluster", "student_proximity"],
      "notes": "Open layout; music zone"
    }
  },
  {
    "name": "Moleskine",
    "description": "Moleskine vende notebook e accessori scrittura/viaggio premium. Store 40‑150 m² in zone creative, aeroporti e concept store.",
    "requirements": {
      "contractTypes": ["LEASE", "CONCESSION"],
      "positions": ["HIGH_STREET", "TRAVEL_RETAIL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 40, "max": 150 },
      "shopWindows": { "min": 1 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["creative_quarter", "bookstore_cluster", "transit_hub", "cultural_tourism"],
      "notes": "Customization station; café‑concept possibile"
    }
  },
  {
    "name": "Moncler",
    "description": "Moncler, luxury outerwear e sportswear. Flagship 400‑800 m² e boutique 200‑400 m² in top luxury street e ski resort.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 200, "max": 800 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 4 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": 2,
      "attractors": ["luxury_fashion_mile", "ski_resort_proximity", "affluent_international"],
      "notes": "Installazioni artistiche stagionali"
    }
  },
  {
    "name": "Mondo Camerette",
    "description": "Mondo Camerette propone arredo bambini/ragazzi. Store 600‑1.500 m² in retail park o zone commerciali periferiche.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["RETAIL_PARK", "PERIPHERAL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 600, "max": 1500 },
      "shopWindows": { "min": 0 },
      "divisible": false,
      "height": { "min": 4 },
      "parkingSlots": { "min": 50 },
      "floorsAllowed": null,
      "attractors": ["furniture_cluster", "family_catchment", "weekend_destination"],
      "notes": "Showroom + magazzino; area giochi"
    }
  },
  {
    "name": "Monnalisa",
    "description": "Monnalisa crea childrenswear luxury 0‑16 anni. Boutique 80‑200 m² in high‑street premium e department store.",
    "requirements": {
      "contractTypes": ["LEASE", "CONCESSION"],
      "positions": ["HIGH_STREET", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 80, "max": 200 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["luxury_children_cluster", "affluent_families", "tourist_shopping"],
      "notes": "Play area glamour"
    }
  },
  {
    "name": "Mont Blanc",
    "description": "Montblanc (Richemont) produce strumenti scrittura, pelletteria e orologi luxury. Boutique 100‑250 m² in luxury high‑street.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "TRAVEL_RETAIL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 100, "max": 250 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 3 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["luxury_accessories_zone", "business_district", "international_clientele"],
      "notes": "Atelier personalizzazione"
    }
  },
  {
    "name": "Moschino",
    "description": "Moschino, fashion house italiana ironica‑luxury. Store 200‑400 m² in luxury street e top department store.",
    "requirements": {
      "contractTypes": ["LEASE", "CONCESSION"],
      "positions": ["HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 200, "max": 400 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 3.5 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["luxury_fashion_cluster", "young_luxury_consumer", "fashion_week_city"],
      "notes": "Window display teatrali"
    }
  },
  {
    "name": "Motivi",
    "description": "Motivi (Miroglio Group) offre moda femminile accessibile. Store 150‑400 m² in high‑street e centri commerciali mainstream.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 150, "max": 400 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["female_fashion_cluster", "mid_market_mall", "25_45_age_target"],
      "notes": ""
    }
  },
  {
    "name": "Napapijri",
    "description": "Napapijri (VF Corp) propone premium outdoor lifestyle. Store 120‑300 m² in high‑street, mall e località montane.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 120, "max": 300 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["outdoor_sport_cluster", "mountain_proximity", "young_urban_explorer"],
      "notes": "Concept eco‑sostenibile"
    }
  },
  {
    "name": "Nara Camicie",
    "description": "Nara Camicie è specialista camiceria italiana uomo/donna. Store 80‑200 m² in vie shopping e centri commerciali.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 80, "max": 200 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["business_fashion_cluster", "professional_target"],
      "notes": "Servizio su misura"
    }
  },
  {
    "name": "Natura Si",
    "description": "NaturaSì è leader italiano del biologico. Store 200‑600 m² in zone residenziali medio‑alte e vie semi‑centrali.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["URBAN", "HIGH_STREET"],
      "type": "SHOP_SPACE",
      "gla": { "min": 200, "max": 600 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 10 },
      "floorsAllowed": null,
      "attractors": ["affluent_residential", "health_conscious_demographics", "competitor_distance"],
      "notes": "Banco gastronomia; corner bistrot possibile"
    }
  },
  {
    "name": "Natuzzi",
    "description": "Natuzzi produce divani e arredo Made in Italy. Store 400‑1.000 m² in zone arredo, retail park e high‑street premium.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["RETAIL_PARK", "HIGH_STREET", "PERIPHERAL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 400, "max": 1000 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 4 },
      "parkingSlots": { "min": 20 },
      "floorsAllowed": null,
      "attractors": ["furniture_district", "affluent_catchment", "design_conscious_consumer"],
      "notes": "Design gallery concept"
    }
  },
  {
    "name": "Nau",
    "description": "Nau! propone occhiali fashion accessibili. Store 60‑150 m² in centri commerciali e high‑street mass‑market.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["MALL", "HIGH_STREET", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 60, "max": 150 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["health_beauty_cluster", "high_footfall", "value_positioning"],
      "notes": "Lab ottico interno"
    }
  },
  {
    "name": "New Yorker",
    "description": "New Yorker è fast‑fashion tedesco young‑oriented. Mega‑store 1.000‑3.000 m² in high‑street e grandi centri commerciali.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 1000, "max": 3000 },
      "shopWindows": { "min": 5 },
      "divisible": false,
      "height": { "min": 4 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": 2,
      "attractors": ["young_fashion_destination", "student_city", "nightlife_proximity"],
      "notes": "DJ set area; fitting lounge"
    }
  },
  {
    "name": "NKD",
    "description": "NKD è discount abbigliamento tedesco famiglia. Store 400‑800 m² in zone commerciali secondarie e retail park.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["RETAIL_PARK", "PERIPHERAL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 400, "max": 800 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 30 },
      "floorsAllowed": null,
      "attractors": ["discount_cluster", "family_residential", "price_sensitive_area"],
      "notes": "Layout self‑service"
    }
  },
  {
    "name": "Nike",
    "description": "Nike, brand sport performance & lifestyle. Flagship 600 m²+; format city/mall 120‑600 m²; cluster sport & youth.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 120, "max": 600 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["sport_cluster", "high_footfall", "young_consumer"],
      "notes": ""
    }
  },
  {
    "name": "Nucleo",
    "description": "Nucleo propone streetwear e sneaker. Store 80‑200 m² in zone urban‑young e centri commerciali trend‑oriented.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 80, "max": 200 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["streetwear_cluster", "young_urban_culture", "sneaker_destination"],
      "notes": "Event space; limited edition wall"
    }
  },
  {
    "name": "Nuna Lie",
    "description": "Nuna Lie offre fashion donna accessible luxury. Store 150‑350 m² in high‑street premium e top mall regionali.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL"],
      "type": "SHOP_SPACE",
      "gla": { "min": 150, "max": 350 },
      "shopWindows": { "min": 3 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["premium_female_fashion", "mature_affluent_shopper", "weekend_destination"],
      "notes": "Personal shopper service"
    }
  },
  {
    "name": "NYX",
    "description": "NYX Professional Makeup (L'Oréal) propone cosmesi professionale accessibile. Store 50‑150 m² in high‑street young e mall.",
    "requirements": {
      "contractTypes": ["LEASE"],
      "positions": ["HIGH_STREET", "MALL", "URBAN"],
      "type": "SHOP_SPACE",
      "gla": { "min": 50, "max": 150 },
      "shopWindows": { "min": 2 },
      "divisible": false,
      "height": { "min": 0 },
      "parkingSlots": { "min": 0 },
      "floorsAllowed": null,
      "attractors": ["beauty_cluster", "young_female_target", "social_media_generation"],
      "notes": "Makeup station interattive; workshop area"
    }
  }
];

// Funzione helper per trovare brand per nome
function findBrandByName(name) {
    return BRAND_DATABASE.find(brand => 
        brand.name.toLowerCase() === name.toLowerCase()
    );
}

// Funzione helper per filtrare brand per requisiti
function filterBrandsByRequirements(criteria) {
    return BRAND_DATABASE.filter(brand => {
        const req = brand.requirements;
        
        // Controlla superficie
        if (criteria.gla) {
            if (criteria.gla < req.gla.min || criteria.gla > req.gla.max) {
                return false;
            }
        }
        
        // Controlla posizione
        if (criteria.position && req.positions.length > 0) {
            if (!req.positions.some(pos => pos === criteria.position)) {
                return false;
            }
        }
        
        // Controlla tipo contratto
        if (criteria.contractType && req.contractTypes.length > 0) {
            if (!req.contractTypes.some(ct => ct === criteria.contractType)) {
                return false;
            }
        }
        
        // Controlla numero vetrine
        if (criteria.shopWindows && req.shopWindows.min > 0) {
            if (criteria.shopWindows < req.shopWindows.min) {
                return false;
            }
        }
        
        // Controlla parcheggi
        if (criteria.parkingSlots !== undefined && req.parkingSlots.min > 0) {
            if (criteria.parkingSlots < req.parkingSlots.min) {
                return false;
            }
        }
        
        return true;
    });
}

// Funzione per calcolare score di compatibilità
function calculateBrandCompatibilityScore(brand, propertyData, neighborhoodData) {
    let score = 0;
    let maxScore = 0;
    const details = [];
    
    // 1. Superficie (peso: 3)
    maxScore += 3;
    if (propertyData.superficie_mq) {
        const gla = propertyData.superficie_mq;
        if (gla >= brand.requirements.gla.min && gla <= brand.requirements.gla.max) {
            score += 3;
            details.push(`✓ Superficie compatibile (${gla} mq)`);
        } else {
            details.push(`✗ Superficie non compatibile (richiesti ${brand.requirements.gla.min}-${brand.requirements.gla.max} mq)`);
        }
    }
    
    // 2. Vetrine (peso: 2)
    if (brand.requirements.shopWindows.min > 0) {
        maxScore += 2;
        if (propertyData.numero_vetrine && propertyData.numero_vetrine >= brand.requirements.shopWindows.min) {
            score += 2;
            details.push(`✓ Numero vetrine adeguato`);
        } else {
            details.push(`✗ Vetrine insufficienti (richieste min. ${brand.requirements.shopWindows.min})`);
        }
    }
    
    // 3. Parcheggi (peso: 2)
    if (brand.requirements.parkingSlots.min > 0) {
        maxScore += 2;
        if (propertyData.posti_auto && propertyData.posti_auto >= brand.requirements.parkingSlots.min) {
            score += 2;
            details.push(`✓ Parcheggi sufficienti`);
        } else {
            details.push(`✗ Parcheggi insufficienti (richiesti min. ${brand.requirements.parkingSlots.min})`);
        }
    }
    
    // 4. Attrattori (peso: 3)
    if (brand.requirements.attractors.length > 0) {
        maxScore += 3;
        let attractorMatches = 0;
        brand.requirements.attractors.forEach(attractor => {
            // Cerca l'attrattore nel testo del quartiere
            if (neighborhoodData && neighborhoodData.toLowerCase().includes(attractor.replace(/_/g, ' '))) {
                attractorMatches++;
            }
        });
        if (attractorMatches > 0) {
            const attractorScore = Math.min(3, attractorMatches);
            score += attractorScore;
            details.push(`✓ Presenza di ${attractorMatches} attrattori richiesti`);
        } else {
            details.push(`✗ Attrattori richiesti non presenti`);
        }
    }
    
    // Calcola punteggio finale su 10
    const finalScore = maxScore > 0 ? (score / maxScore) * 10 : 0;
    
    return {
        score: Math.round(finalScore * 10) / 10,
        details: details
    };
}

// Funzione per formattare i dati dei brand per Gemini
function formatBrandsForGemini() {
    return BRAND_DATABASE.map(brand => ({
        nome: brand.name,
        descrizione: brand.description,
        requisiti: {
            superficie: `${brand.requirements.gla.min}-${brand.requirements.gla.max} mq`,
            contratto: brand.requirements.contractTypes.join(', '),
            posizioni: brand.requirements.positions.join(', '),
            vetrine_min: brand.requirements.shopWindows.min,
            parcheggi_min: brand.requirements.parkingSlots.min,
            attrattori: brand.requirements.attractors.join(', '),
            note: brand.requirements.notes
        }
    }));
}

// Export per l'uso nei moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        BRAND_DATABASE, 
        findBrandByName, 
        filterBrandsByRequirements,
        calculateBrandCompatibilityScore,
        formatBrandsForGemini
    };
}