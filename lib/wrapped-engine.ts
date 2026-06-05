import type { BracketState, QualifiedTeam } from "./build-bracket"

// ── Confederation mapping (all 48 WC 2026 teams) ──────────────────────────────

const CONFEDERATION: Record<string, string> = {
  // UEFA — Europe (16)
  czechia: "UEFA",
  "bosnia-and-herzegovina": "UEFA",
  switzerland: "UEFA",
  scotland: "UEFA",
  turkey: "UEFA",
  germany: "UEFA",
  netherlands: "UEFA",
  sweden: "UEFA",
  belgium: "UEFA",
  spain: "UEFA",
  france: "UEFA",
  norway: "UEFA",
  austria: "UEFA",
  portugal: "UEFA",
  england: "UEFA",
  croatia: "UEFA",
  // CONMEBOL — South America (6)
  brazil: "CONMEBOL",
  paraguay: "CONMEBOL",
  ecuador: "CONMEBOL",
  uruguay: "CONMEBOL",
  argentina: "CONMEBOL",
  colombia: "CONMEBOL",
  // CONCACAF — North/Central America & Caribbean (6)
  mexico: "CONCACAF",
  canada: "CONCACAF",
  haiti: "CONCACAF",
  usa: "CONCACAF",
  curacao: "CONCACAF",
  panama: "CONCACAF",
  // CAF — Africa (10)
  "south-africa": "CAF",
  morocco: "CAF",
  "ivory-coast": "CAF",
  egypt: "CAF",
  "cabo-verde": "CAF",
  senegal: "CAF",
  algeria: "CAF",
  "dr-congo": "CAF",
  ghana: "CAF",
  tunisia: "CAF",
  // AFC — Asia (9)
  "south-korea": "AFC",
  qatar: "AFC",
  australia: "AFC",
  japan: "AFC",
  iran: "AFC",
  "saudi-arabia": "AFC",
  iraq: "AFC",
  jordan: "AFC",
  uzbekistan: "AFC",
  // OFC — Oceania (1)
  "new-zealand": "OFC",
}

export type PersonalityArchetype =
  | "Chaos Agent"
  | "The Contrarian"
  | "The Loyalist"
  | "The Oracle"
  | "The Traditionalist"
  | "The Romantic"

export type Insight = {
  label: string
  caption: string
}

export type WrappedProfile = {
  displayName: string
  champion: QualifiedTeam
  finalOpponent: QualifiedTeam | null
  semiFinalists: QualifiedTeam[]
  quarterFinalists: QualifiedTeam[]
  champConfederation: string
  volatilityScore: number
  upsetCount: number
  totalMatches: number
  dominantConfederation: string
  dominantConfCount: number
  personalityArchetype: PersonalityArchetype
  archetypeTagline: string
  headline: string
  insights: Insight[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getConfederation(teamId: string): string {
  return CONFEDERATION[teamId] ?? "UEFA"
}

function computeVolatility(bracket: BracketState) {
  const decided = bracket.matches.filter((m) => m.winner !== null)
  let upsets = 0
  for (const match of decided) {
    if (!match.winner || !match.team1 || !match.team2) continue
    const loser = match.winner.id === match.team1.id ? match.team2 : match.team1
    if (match.winner.position > loser.position) upsets++
  }
  return {
    score: decided.length > 0 ? upsets / decided.length : 0,
    upsets,
    total: decided.length,
  }
}

function getDominantConfederation(bracket: BracketState): { conf: string; count: number } {
  // Use semi-final teams as the "final four"
  const sfTeams = bracket.matches
    .filter((m) => m.round === 4)
    .flatMap((m) => [m.team1, m.team2].filter(Boolean) as QualifiedTeam[])

  const pool = sfTeams.length > 0
    ? sfTeams
    : bracket.matches
        .filter((m) => m.round === 3 && m.winner)
        .map((m) => m.winner!)

  const counts: Record<string, number> = {}
  for (const team of pool) {
    const conf = getConfederation(team.id)
    counts[conf] = (counts[conf] ?? 0) + 1
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? { conf: sorted[0][0], count: sorted[0][1] } : { conf: "UEFA", count: 0 }
}

// ── Archetype derivation ──────────────────────────────────────────────────────

function deriveArchetype(
  champion: QualifiedTeam,
  volatility: number,
  upsets: number,
  champConf: string,
  dominantConf: string,
  dominantCount: number
): PersonalityArchetype {
  if (volatility > 0.55) return "Chaos Agent"
  if (champConf === "AFC" || champConf === "OFC" || champConf === "CAF") return "The Oracle"
  if (dominantCount >= 3 && (dominantConf === "CONMEBOL" || dominantConf === "UEFA"))
    return "The Loyalist"
  if (champion.position !== 1 || upsets > 5) return "The Contrarian"
  if (volatility < 0.1 && champion.position === 1) return "The Traditionalist"
  return "The Romantic"
}

const ARCHETYPE_TAGLINES: Record<PersonalityArchetype, string> = {
  "Chaos Agent": "You trust no seed and fear no giant. Pure anarchy.",
  "The Contrarian": "You see what others miss. The underdog always had a chance.",
  "The Loyalist": "Your bracket is a love letter to one corner of the world.",
  "The Oracle": "You believed before anyone else. History will remember.",
  "The Traditionalist": "Form is form. You don't gamble on miracles.",
  "The Romantic": "Football, beautiful and unpredictable. Just like your picks.",
}

// ── Headline derivation ───────────────────────────────────────────────────────

function deriveHeadline(
  champion: QualifiedTeam,
  archetype: PersonalityArchetype,
  champConf: string,
  finalOpponent: QualifiedTeam | null
): string {
  const c = champion.name
  const opp = finalOpponent?.name ?? "the world"

  switch (archetype) {
    case "The Oracle":
      return `You saw ${c} coming. Nobody else did.`
    case "Chaos Agent":
      return `Your bracket is a beautiful disaster. ${c} somehow lifts the trophy.`
    case "The Traditionalist":
      return `${c}. No drama, no detours. Just inevitable.`
    case "The Contrarian":
      return `${c} over ${opp}. You always bet against the favourite.`
    case "The Loyalist":
      return `Your heart wrote this bracket. ${c} rewards the faith.`
    default:
      return `${c} in the final. A World Cup story worth telling.`
  }
}

// ── Insight derivation ────────────────────────────────────────────────────────

const CONF_FULL: Record<string, string> = {
  UEFA: "Europe",
  CONMEBOL: "South America",
  CONCACAF: "North & Central America",
  CAF: "Africa",
  AFC: "Asia",
  OFC: "Oceania",
}

function deriveInsights(
  champion: QualifiedTeam,
  volatility: number,
  upsets: number,
  champConf: string,
  dominantConf: string,
  dominantCount: number
): Insight[] {
  const insights: Insight[] = []

  // 1. Champion path insight
  if (champion.position === 3) {
    insights.push({
      label: "Third Place, World Champion",
      caption: `${champion.name} entered as a third-place qualifier and won the whole thing. You backed the longest shot in the draw.`,
    })
  } else if (champion.position === 2) {
    insights.push({
      label: "Runner-Up Turned Champion",
      caption: `${champion.name} didn't even top their group — but your bracket says they top the world.`,
    })
  } else {
    insights.push({
      label: "Dominant From Day One",
      caption: `${champion.name} won their group and won everything after. Your picks say the best team always wins.`,
    })
  }

  // 2. Upset / volatility insight
  if (volatility > 0.4) {
    insights.push({
      label: `${upsets} Upsets Called`,
      caption: `Over ${Math.round(volatility * 100)}% of your picks went against the seeding. You don't trust the form book — and you don't apologise for it.`,
    })
  } else if (upsets === 0) {
    insights.push({
      label: "Zero Upsets",
      caption: `The higher seed won every single match in your bracket. You believe football is perfectly predictable. Brave.`,
    })
  } else {
    insights.push({
      label: `${upsets} Surprise${upsets !== 1 ? "s" : ""}`,
      caption: `You gave the underdogs their moments — just not too many. A measured, considered bracket.`,
    })
  }

  // 3. Confederation / global insight
  if (champConf === "CAF" || champConf === "AFC" || champConf === "OFC") {
    insights.push({
      label: "Writing New History",
      caption: `${champion.name} from ${CONF_FULL[champConf] ?? champConf} as World Champions. Your bracket puts a new name on the trophy.`,
    })
  } else if (dominantCount >= 3) {
    insights.push({
      label: `${CONF_FULL[dominantConf] ?? dominantConf} Runs the Table`,
      caption: `${dominantCount} of your final four came from the same confederation. Your bracket has a clear heartbeat.`,
    })
  } else {
    insights.push({
      label: "The World Shows Up",
      caption: `No single confederation dominated your final four. Your bracket says football really does belong to everyone.`,
    })
  }

  return insights.slice(0, 3)
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildWrappedProfile(
  bracket: BracketState,
  displayName: string
): WrappedProfile | null {
  if (!bracket.champion) return null

  const champion = bracket.champion
  const champConf = getConfederation(champion.id)
  const { score: volatilityScore, upsets: upsetCount, total: totalMatches } = computeVolatility(bracket)

  const finalMatch = bracket.matches.find((m) => m.round === 5)
  const finalOpponent = finalMatch
    ? finalMatch.team1?.id === champion.id
      ? finalMatch.team2 ?? null
      : finalMatch.team1 ?? null
    : null

  const semiFinalists = bracket.matches
    .filter((m) => m.round === 4)
    .flatMap((m) => [m.team1, m.team2].filter(Boolean) as QualifiedTeam[])

  const quarterFinalists = bracket.matches
    .filter((m) => m.round === 3)
    .flatMap((m) => [m.team1, m.team2].filter(Boolean) as QualifiedTeam[])

  const { conf: dominantConf, count: dominantConfCount } = getDominantConfederation(bracket)

  const personalityArchetype = deriveArchetype(
    champion, volatilityScore, upsetCount, champConf, dominantConf, dominantConfCount
  )
  const archetypeTagline = ARCHETYPE_TAGLINES[personalityArchetype]
  const headline = deriveHeadline(champion, personalityArchetype, champConf, finalOpponent)
  const insights = deriveInsights(
    champion, volatilityScore, upsetCount, champConf, dominantConf, dominantConfCount
  )

  return {
    displayName,
    champion,
    finalOpponent,
    semiFinalists,
    quarterFinalists,
    champConfederation: champConf,
    volatilityScore,
    upsetCount,
    totalMatches,
    dominantConfederation: dominantConf,
    dominantConfCount,
    personalityArchetype,
    archetypeTagline,
    headline,
    insights,
  }
}
