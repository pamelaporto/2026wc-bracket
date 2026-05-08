// lib/flags.ts
export function computeFlagGradient(colors?: string[]) {
  if (!colors || colors.length === 0) {
    return "linear-gradient(135deg, #555 0%, #333 100%)"
  }

  // 2 colors => diagonal split (matches your intro look)
  if (colors.length === 2) {
    const [a, b] = colors
    return `linear-gradient(135deg, ${a} 0%, ${a} 48%, ${b} 52%, ${b} 100%)`
  }

  // 3 colors => 3 diagonal bands
  if (colors.length === 3) {
    const [a, b, c] = colors
    return `linear-gradient(135deg, ${a} 0%, ${a} 33%, ${b} 33%, ${b} 66%, ${c} 66%, ${c} 100%)`
  }

  // fallback for 4+ colors
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%)`
}
