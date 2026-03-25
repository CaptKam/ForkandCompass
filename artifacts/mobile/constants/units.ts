// ─── Measurement unit conversion engine ──────────────────────────────────────

export type MeasurementSystem = "us_customary" | "metric" | "imperial_uk" | "show_both";
export type TemperatureUnit = "fahrenheit" | "celsius";

// ─── Parsing ─────────────────────────────────────────────────────────────────

/** Parse an amount string like "200g", "1 cup", "2 tbsp" into numeric + unit parts */
export function parseAmount(raw: string): { quantity: number; unit: string; rest: string; parsed: boolean } {
  const trimmed = raw.trim();
  // Match leading number (int, decimal, or fraction) then unit, then optional remainder
  const match = trimmed.match(/^(\d+(?:[.,\/]\d+)?)\s*([a-zA-Z°]+[a-zA-Z .°]*?)(?:\s+(.*))?$/);
  if (match) {
    let quantity: number;
    const numStr = match[1];
    if (numStr.includes("/")) {
      const [num, den] = numStr.split("/");
      quantity = parseInt(num, 10) / parseInt(den, 10);
    } else {
      quantity = parseFloat(numStr.replace(",", "."));
    }
    const unit = (match[2] ?? "").trim();
    const rest = (match[3] ?? "").trim();
    if (!isNaN(quantity)) {
      return { quantity, unit, rest, parsed: true };
    }
  }
  // Try bare number (e.g. "4" for count-based ingredients)
  const bareNum = trimmed.match(/^(\d+(?:[.,\/]\d+)?)\s*$/);
  if (bareNum) {
    const numStr = bareNum[1];
    let quantity: number;
    if (numStr.includes("/")) {
      const [num, den] = numStr.split("/");
      quantity = parseInt(num, 10) / parseInt(den, 10);
    } else {
      quantity = parseFloat(numStr.replace(",", "."));
    }
    if (!isNaN(quantity)) return { quantity, unit: "", rest: "", parsed: true };
  }
  return { quantity: 1, unit: "", rest: "", parsed: false };
}

// ─── Friendly fractions ──────────────────────────────────────────────────────

const FRACTION_MAP: [number, string][] = [
  [0.125, "\u215B"],  // ⅛
  [0.25, "\u00BC"],   // ¼
  [1 / 3, "\u2153"],  // ⅓
  [0.375, "\u215C"],  // ⅜
  [0.5, "\u00BD"],    // ½
  [0.625, "\u215D"],  // ⅝
  [2 / 3, "\u2154"],  // ⅔
  [0.75, "\u00BE"],   // ¾
  [0.875, "\u215E"],  // ⅞
];

const TOLERANCE = 0.04;

function toFriendlyNumber(value: number): string {
  if (value < 0.01) return "0";
  const intPart = Math.floor(value);
  const frac = value - intPart;

  if (frac < TOLERANCE) {
    return String(intPart);
  }
  if (1 - frac < TOLERANCE) {
    return String(intPart + 1);
  }

  for (const [target, symbol] of FRACTION_MAP) {
    if (Math.abs(frac - target) < TOLERANCE) {
      return intPart > 0 ? `${intPart}${symbol}` : symbol;
    }
  }
  // No matching fraction — use one decimal
  return value.toFixed(1).replace(/\.0$/, "");
}

// ─── Unit canonicalization ───────────────────────────────────────────────────

type UnitKind = "weight" | "volume" | "length" | "count" | "unknown";
type UnitSystem = "metric" | "us" | "imperial" | "any";

interface UnitInfo {
  canonical: string;
  kind: UnitKind;
  system: UnitSystem;
  toBase: number; // multiply by this to get base unit (g for weight, ml for volume, cm for length)
}

const UNIT_TABLE: Record<string, UnitInfo> = {
  // ── Weight (base: grams) ──
  g:       { canonical: "g", kind: "weight", system: "metric", toBase: 1 },
  gram:    { canonical: "g", kind: "weight", system: "metric", toBase: 1 },
  grams:   { canonical: "g", kind: "weight", system: "metric", toBase: 1 },
  kg:      { canonical: "kg", kind: "weight", system: "metric", toBase: 1000 },
  kilogram:  { canonical: "kg", kind: "weight", system: "metric", toBase: 1000 },
  kilograms: { canonical: "kg", kind: "weight", system: "metric", toBase: 1000 },
  oz:      { canonical: "oz", kind: "weight", system: "us", toBase: 28.3495 },
  ounce:   { canonical: "oz", kind: "weight", system: "us", toBase: 28.3495 },
  ounces:  { canonical: "oz", kind: "weight", system: "us", toBase: 28.3495 },
  lb:      { canonical: "lb", kind: "weight", system: "us", toBase: 453.592 },
  lbs:     { canonical: "lb", kind: "weight", system: "us", toBase: 453.592 },
  pound:   { canonical: "lb", kind: "weight", system: "us", toBase: 453.592 },
  pounds:  { canonical: "lb", kind: "weight", system: "us", toBase: 453.592 },

  // ── Volume (base: ml) ──
  ml:          { canonical: "ml", kind: "volume", system: "metric", toBase: 1 },
  milliliter:  { canonical: "ml", kind: "volume", system: "metric", toBase: 1 },
  milliliters: { canonical: "ml", kind: "volume", system: "metric", toBase: 1 },
  l:           { canonical: "L", kind: "volume", system: "metric", toBase: 1000 },
  liter:       { canonical: "L", kind: "volume", system: "metric", toBase: 1000 },
  liters:      { canonical: "L", kind: "volume", system: "metric", toBase: 1000 },
  tsp:         { canonical: "tsp", kind: "volume", system: "us", toBase: 4.929 },
  teaspoon:    { canonical: "tsp", kind: "volume", system: "us", toBase: 4.929 },
  teaspoons:   { canonical: "tsp", kind: "volume", system: "us", toBase: 4.929 },
  tbsp:        { canonical: "tbsp", kind: "volume", system: "us", toBase: 14.787 },
  tablespoon:  { canonical: "tbsp", kind: "volume", system: "us", toBase: 14.787 },
  tablespoons: { canonical: "tbsp", kind: "volume", system: "us", toBase: 14.787 },
  "fl oz":     { canonical: "fl oz", kind: "volume", system: "us", toBase: 29.5735 },
  cup:         { canonical: "cup", kind: "volume", system: "us", toBase: 236.588 },
  cups:        { canonical: "cup", kind: "volume", system: "us", toBase: 236.588 },
  qt:          { canonical: "qt", kind: "volume", system: "us", toBase: 946.353 },
  quart:       { canonical: "qt", kind: "volume", system: "us", toBase: 946.353 },
  quarts:      { canonical: "qt", kind: "volume", system: "us", toBase: 946.353 },
  gal:         { canonical: "gal", kind: "volume", system: "us", toBase: 3785.41 },
  gallon:      { canonical: "gal", kind: "volume", system: "us", toBase: 3785.41 },
  gallons:     { canonical: "gal", kind: "volume", system: "us", toBase: 3785.41 },
  pt:          { canonical: "pt", kind: "volume", system: "imperial", toBase: 568.261 },
  pint:        { canonical: "pt", kind: "volume", system: "imperial", toBase: 568.261 },
  pints:       { canonical: "pt", kind: "volume", system: "imperial", toBase: 568.261 },

  // ── Length (base: cm) ──
  cm:          { canonical: "cm", kind: "length", system: "metric", toBase: 1 },
  centimeter:  { canonical: "cm", kind: "length", system: "metric", toBase: 1 },
  centimeters: { canonical: "cm", kind: "length", system: "metric", toBase: 1 },
  in:          { canonical: "in", kind: "length", system: "us", toBase: 2.54 },
  inch:        { canonical: "in", kind: "length", system: "us", toBase: 2.54 },
  inches:      { canonical: "in", kind: "length", system: "us", toBase: 2.54 },
};

function lookupUnit(raw: string): UnitInfo | undefined {
  const key = raw.toLowerCase().replace(/\.$/, "");
  return UNIT_TABLE[key];
}

function unitBelongsToTarget(info: UnitInfo, target: MeasurementSystem): boolean {
  if (target === "show_both") return false; // always convert
  if (target === "metric") return info.system === "metric";
  if (target === "us_customary") return info.system === "us" || info.system === "any";
  if (target === "imperial_uk") return info.system === "us" || info.system === "imperial" || info.system === "any";
  return false;
}

// ─── Smart unit selection ────────────────────────────────────────────────────

function pickWeightUnit(grams: number, target: MeasurementSystem): { quantity: number; unit: string } {
  if (target === "metric" || target === "show_both") {
    if (grams >= 1000) return { quantity: grams / 1000, unit: "kg" };
    return { quantity: grams, unit: "g" };
  }
  // US / Imperial — use oz and lb
  const oz = grams / 28.3495;
  if (oz >= 16) {
    const lb = oz / 16;
    return { quantity: lb, unit: "lb" };
  }
  return { quantity: oz, unit: "oz" };
}

function pickVolumeUnit(ml: number, target: MeasurementSystem): { quantity: number; unit: string } {
  if (target === "metric" || target === "show_both") {
    if (ml >= 1000) return { quantity: ml / 1000, unit: "L" };
    return { quantity: ml, unit: "ml" };
  }

  if (target === "imperial_uk") {
    // Imperial pint = 568ml
    if (ml >= 568) return { quantity: ml / 568.261, unit: "pt" };
    if (ml >= 284) return { quantity: ml / 284.131, unit: "cup" };
    if (ml >= 17.758) return { quantity: ml / 17.758, unit: "tbsp" };
    return { quantity: ml / 5.919, unit: "tsp" };
  }

  // US Customary — smart selection
  if (ml <= 5.5) return { quantity: ml / 4.929, unit: "tsp" };
  if (ml <= 18) return { quantity: ml / 14.787, unit: "tbsp" };
  if (ml <= 60) return { quantity: ml / 14.787, unit: "tbsp" };
  if (ml <= 946) return { quantity: ml / 236.588, unit: "cup" };
  return { quantity: ml / 946.353, unit: "qt" };
}

function pickLengthUnit(cm: number, target: MeasurementSystem): { quantity: number; unit: string } {
  if (target === "metric" || target === "show_both") return { quantity: cm, unit: "cm" };
  return { quantity: cm / 2.54, unit: "in" };
}

// ─── Format result ───────────────────────────────────────────────────────────

function formatConverted(quantity: number, unit: string, rest: string): string {
  const friendly = toFriendlyNumber(quantity);
  const parts = [friendly, unit].filter(Boolean).join(" ");
  return rest ? `${parts} ${rest}` : parts;
}

// ─── Main conversion function ────────────────────────────────────────────────

/**
 * Convert an ingredient amount string to the target measurement system.
 * Returns the original string unchanged if no conversion is needed or possible.
 */
export function convertAmount(raw: string, target: MeasurementSystem): string {
  if (target === "metric") {
    // Data is already stored in metric — skip parsing for performance
    // unless the string contains non-metric units
    const { quantity, unit, rest, parsed } = parseAmount(raw);
    if (!parsed) return raw;
    const info = lookupUnit(unit);
    if (!info) return raw;
    if (info.system === "metric") return raw;
    // Non-metric unit found — convert it
    return convertParsed(quantity, unit, rest, info, target, raw);
  }

  const { quantity, unit, rest, parsed } = parseAmount(raw);
  if (!parsed) return raw;

  const info = lookupUnit(unit);
  if (!info) return raw; // unrecognized unit, pass through

  if (target !== "show_both" && unitBelongsToTarget(info, target)) {
    return raw; // already in target system
  }

  return convertParsed(quantity, unit, rest, info, target, raw);
}

function convertParsed(
  quantity: number,
  unit: string,
  rest: string,
  info: UnitInfo,
  target: MeasurementSystem,
  raw: string,
): string {
  const baseValue = quantity * info.toBase;
  let result: { quantity: number; unit: string };

  const convertTarget = target === "show_both"
    ? (info.system === "metric" ? "us_customary" : "metric")
    : target;

  switch (info.kind) {
    case "weight":
      result = pickWeightUnit(baseValue, convertTarget);
      break;
    case "volume":
      result = pickVolumeUnit(baseValue, convertTarget);
      break;
    case "length":
      result = pickLengthUnit(baseValue, convertTarget);
      break;
    default:
      return raw;
  }

  const converted = formatConverted(result.quantity, result.unit, rest);

  if (target === "show_both") {
    // Show original with converted in parentheses
    return `${raw} (${converted})`;
  }

  return converted;
}

// ─── Temperature conversion ──────────────────────────────────────────────────

function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function fToC(f: number): number {
  return Math.round((f - 32) * 5 / 9);
}

const TEMP_PATTERN = /(\d+)\s*°\s*([CF])/gi;

/**
 * Convert temperature references in instruction text to the target unit.
 * Handles patterns like "200°C", "400°F", "200 °C".
 */
export function convertTemperatureInText(text: string, target: TemperatureUnit): string {
  return text.replace(TEMP_PATTERN, (match, digits, unit) => {
    const value = parseInt(digits, 10);
    const isC = unit.toUpperCase() === "C";
    const isF = unit.toUpperCase() === "F";

    if (target === "celsius" && isF) {
      return `${fToC(value)}°C`;
    }
    if (target === "fahrenheit" && isC) {
      return `${cToF(value)}°F`;
    }
    return match; // already correct unit
  });
}
