/**
 * Scale an ingredient amount string like "200g", "2 cups", "1/2 tsp" by a ratio.
 * Returns the original string unchanged if it cannot be parsed (e.g. "to taste", "a pinch").
 */
export function scaleAmount(raw: string, ratio: number): string {
  if (ratio === 1) return raw;
  const trimmed = raw.trim();

  // Match fractions like "1/2 cup"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)/);
  if (fracMatch) {
    const val = (parseInt(fracMatch[1], 10) / parseInt(fracMatch[2], 10)) * ratio;
    const rest = fracMatch[3];
    const display = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
    return rest ? `${display} ${rest}` : display;
  }

  // Match decimals like "200g", "1.5 cups", "2 tbsp"
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]) * ratio;
    const rest = numMatch[2];
    const display = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
    return rest ? `${display} ${rest}` : display;
  }

  // No numeric prefix — return unchanged
  return raw;
}

/**
 * Format a number of seconds into MM:SS or H:MM:SS string.
 */
export function formatSeconds(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hrs > 0) return `${hrs}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
