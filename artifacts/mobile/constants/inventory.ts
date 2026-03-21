/** Kitchen Inventory Scanner — types and constants */

export type ScanZone = "fridge" | "pantry" | "spice_rack" | "counter" | "other";

export interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  zone: ScanZone;
  confidence: number; // 0-1, how confident the detection was
  scannedAt: number; // timestamp
  expiresAt: number | null; // estimated expiry timestamp
  imageUri: string | null; // thumbnail of the detected item
}

export interface ScanSession {
  id: string;
  startedAt: number;
  endedAt: number | null;
  zone: ScanZone;
  itemsDetected: number;
  framesCaptured: number;
}

export type ScannerSpeed = "good" | "fast" | "too_fast";

export interface ScanFrame {
  timestamp: number;
  detectedItems: DetectedItem[];
}

export interface DetectedItem {
  label: string;
  brand: string | null;
  quantity: number | null;
  unit: string | null;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export const SCAN_ZONES: { key: ScanZone; label: string; emoji: string; description: string }[] = [
  { key: "fridge", label: "Fridge", emoji: "\u{1F9CA}", description: "Open your fridge and slowly scan each shelf" },
  { key: "pantry", label: "Pantry", emoji: "\u{1FAD8}", description: "Pan across your pantry shelves" },
  { key: "spice_rack", label: "Spice Rack", emoji: "\u{1F9C2}", description: "Slowly move across your spices" },
  { key: "counter", label: "Counter", emoji: "\u{1F34E}", description: "Scan items on your countertop" },
  { key: "other", label: "Other", emoji: "\u{1F4E6}", description: "Scan any other storage area" },
];

// Speed thresholds (in m/s² of acceleration delta)
export const SPEED_THRESHOLDS = {
  good: 1.5, // below this is good
  fast: 3.0, // above good, below this is "slow down"
  tooFast: 5.0, // above this we pause scanning
};

// Simulated common kitchen items for the detection engine mock
export const COMMON_KITCHEN_ITEMS: { name: string; brands: string[]; defaultUnit: string; zone: ScanZone }[] = [
  { name: "Milk", brands: ["Organic Valley", "Horizon", "Fairlife", "Store Brand"], defaultUnit: "gallon", zone: "fridge" },
  { name: "Eggs", brands: ["Vital Farms", "Eggland's Best", "Pete & Gerry's"], defaultUnit: "dozen", zone: "fridge" },
  { name: "Butter", brands: ["Kerrygold", "Land O'Lakes", "Plugra"], defaultUnit: "stick", zone: "fridge" },
  { name: "Greek Yogurt", brands: ["Chobani", "Fage", "Siggi's"], defaultUnit: "container", zone: "fridge" },
  { name: "Cheddar Cheese", brands: ["Tillamook", "Cabot", "Cracker Barrel"], defaultUnit: "block", zone: "fridge" },
  { name: "Heavy Cream", brands: ["Organic Valley", "Horizon"], defaultUnit: "pint", zone: "fridge" },
  { name: "Parmesan", brands: ["BelGioioso", "Parmigiano Reggiano"], defaultUnit: "wedge", zone: "fridge" },
  { name: "Cream Cheese", brands: ["Philadelphia", "Store Brand"], defaultUnit: "block", zone: "fridge" },
  { name: "Mayonnaise", brands: ["Hellmann's", "Duke's", "Kewpie"], defaultUnit: "jar", zone: "fridge" },
  { name: "Ketchup", brands: ["Heinz", "Hunt's"], defaultUnit: "bottle", zone: "fridge" },
  { name: "Mustard", brands: ["French's", "Grey Poupon", "Gulden's"], defaultUnit: "bottle", zone: "fridge" },
  { name: "Sriracha", brands: ["Huy Fong", "Sky Valley"], defaultUnit: "bottle", zone: "fridge" },
  { name: "Soy Sauce", brands: ["Kikkoman", "San-J", "Yamasa"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Olive Oil", brands: ["California Olive Ranch", "Colavita", "Bertolli"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Vegetable Oil", brands: ["Wesson", "Crisco"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Sesame Oil", brands: ["Kadoya", "La Tourangelle"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Rice", brands: ["Nishiki", "Jasmine", "Basmati", "Uncle Ben's"], defaultUnit: "bag", zone: "pantry" },
  { name: "Pasta", brands: ["Barilla", "De Cecco", "Rummo"], defaultUnit: "box", zone: "pantry" },
  { name: "Flour", brands: ["King Arthur", "Bob's Red Mill", "Gold Medal"], defaultUnit: "bag", zone: "pantry" },
  { name: "Sugar", brands: ["Domino", "C&H"], defaultUnit: "bag", zone: "pantry" },
  { name: "Brown Sugar", brands: ["Domino", "C&H"], defaultUnit: "bag", zone: "pantry" },
  { name: "Canned Tomatoes", brands: ["San Marzano", "Mutti", "Hunt's"], defaultUnit: "can", zone: "pantry" },
  { name: "Coconut Milk", brands: ["Thai Kitchen", "Aroy-D", "Chaokoh"], defaultUnit: "can", zone: "pantry" },
  { name: "Chicken Broth", brands: ["Swanson", "Pacific Foods", "Better Than Bouillon"], defaultUnit: "carton", zone: "pantry" },
  { name: "Peanut Butter", brands: ["Jif", "Skippy", "Justin's"], defaultUnit: "jar", zone: "pantry" },
  { name: "Honey", brands: ["Local", "Nature Nate's"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Vinegar", brands: ["Bragg", "Heinz"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Fish Sauce", brands: ["Red Boat", "Squid Brand", "Three Crabs"], defaultUnit: "bottle", zone: "pantry" },
  { name: "Salt", brands: ["Morton's", "Diamond Crystal", "Maldon"], defaultUnit: "container", zone: "spice_rack" },
  { name: "Black Pepper", brands: ["McCormick", "Simply Organic"], defaultUnit: "grinder", zone: "spice_rack" },
  { name: "Cumin", brands: ["McCormick", "Simply Organic", "Spice Islands"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Paprika", brands: ["McCormick", "Simply Organic", "Szeged"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Cayenne Pepper", brands: ["McCormick", "Simply Organic"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Cinnamon", brands: ["McCormick", "Simply Organic"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Garlic Powder", brands: ["McCormick", "Lawry's"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Onion Powder", brands: ["McCormick", "Spice Islands"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Oregano", brands: ["McCormick", "Simply Organic"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Turmeric", brands: ["McCormick", "Simply Organic"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Red Pepper Flakes", brands: ["McCormick", "Simply Organic"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Bay Leaves", brands: ["McCormick", "Simply Organic"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Garam Masala", brands: ["McCormick", "MDH", "Shan"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Curry Powder", brands: ["McCormick", "S&B"], defaultUnit: "jar", zone: "spice_rack" },
  { name: "Bananas", brands: ["Dole", "Chiquita"], defaultUnit: "bunch", zone: "counter" },
  { name: "Avocados", brands: [], defaultUnit: "piece", zone: "counter" },
  { name: "Tomatoes", brands: [], defaultUnit: "piece", zone: "counter" },
  { name: "Onions", brands: [], defaultUnit: "piece", zone: "counter" },
  { name: "Garlic", brands: [], defaultUnit: "head", zone: "counter" },
  { name: "Lemons", brands: [], defaultUnit: "piece", zone: "counter" },
  { name: "Limes", brands: [], defaultUnit: "piece", zone: "counter" },
  { name: "Potatoes", brands: [], defaultUnit: "lb", zone: "counter" },
];
