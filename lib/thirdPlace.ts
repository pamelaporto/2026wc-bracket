// lib/thirdPlace.ts

export type ThirdPlaceTeam = {
  id: string
  name: string
  colors?: string[]
  groupLetter: string
  // Stats for ranking (user can override or we default to 0)
  points: number
  goalDifference: number
  goalsScored: number
  fairPlay: number
}

export type RankedThirdPlaceTeam = ThirdPlaceTeam & {
  rank: number
}

/**
 * Extract 3rd-place teams from group standings.
 * Assumes teams[2] is the 3rd-place team in each group.
 */
export function extractThirdPlaceTeams(
  groups: Record<string, any[]>
): ThirdPlaceTeam[] {
  const groupLetters = Object.keys(groups).sort()
  const thirdPlaceTeams: ThirdPlaceTeam[] = []

  for (const letter of groupLetters) {
    const teams = groups[letter]
    if (teams && teams.length >= 3) {
      const third = teams[2]
      thirdPlaceTeams.push({
        id: third.id ?? "unknown",
        name: third.name ?? "Unknown",
        colors: third.colors,
        groupLetter: letter,
        // Default stats (in real scenario these would come from match results)
        points: 0,
        goalDifference: 0,
        goalsScored: 0,
        fairPlay: 0,
      })
    }
  }

  return thirdPlaceTeams
}

/**
 * Rank third-place teams by:
 * 1. Points (desc)
 * 2. Goal Difference (desc)
 * 3. Goals Scored (desc)
 * 4. Fair Play (asc - fewer is better)
 * 5. Alphabetic by team id (deterministic tie-break)
 */
export function rankThirdPlaceTeams(
  teams: ThirdPlaceTeam[]
): RankedThirdPlaceTeam[] {
  const sorted = [...teams].sort((a, b) => {
    // 1. Points (desc)
    if (b.points !== a.points) return b.points - a.points
    // 2. Goal Difference (desc)
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    // 3. Goals Scored (desc)
    if (b.goalsScored !== a.goalsScored) return b.goalsScored - a.goalsScored
    // 4. Fair Play (asc - fewer is better)
    if (a.fairPlay !== b.fairPlay) return a.fairPlay - b.fairPlay
    // 5. Alphabetic tie-break
    return a.id.localeCompare(b.id)
  })

  return sorted.map((team, index) => ({
    ...team,
    rank: index + 1,
  }))
}

/**
 * Official FIFA 2026 third-place combination-to-slot mapping.
 * Source: Wikipedia template:2026_FIFA_World_Cup_third-place_table
 * Generated: 2026-06-10
 *
 * Keys are sorted group letters of the 8 qualified third-place teams.
 * Values map each qualified group to the R32 match index where its 3rd place team participates.
 *
 * All 495 possible combinations (C(12,8)) are included.
 * Slot indices map to official FIFA structure:
 *   1→E1, 4→I1, 6→A1, 7→L1, 8→D1, 9→G1, 12→B1, 15→K1
 */
export const THIRD_PLACE_SLOT_MAPPINGS: Record<string, Record<string, number>> = {
  "EFGHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "F": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "DFGHIJKL": {
    "H": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "DEGHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "DEFHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "DEFGIJKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "DEFGHJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "DEFGHIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "DEFGHIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "DEFGHIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "CFGHIJKL": {
    "H": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CEGHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "CEFHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CEFGIJKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CEFGHJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CEFGHIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CEFGHIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "CEFGHIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "CDGHIJKL": {
    "H": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "CDFHIJKL": {
    "C": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDFGIJKL": {
    "C": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDFGHJKL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDFGHIKL": {
    "C": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDFGHIJL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "CDFGHIJK": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "CDEHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "CDEGIJKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "CDEGHJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "CDEGHIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "CDEGHIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "CDEGHIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "CDEFIJKL": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDEFHJKL": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDEFHIKL": {
    "C": 6,
    "E": 12,
    "I": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDEFHIJL": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "CDEFHIJK": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "CDEFGJKL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDEFGIKL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDEFGIJL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "CDEFGIJK": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "CDEFGHKL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "CDEFGHJL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "CDEFGHJK": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "CDEFGHIL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "CDEFGHIK": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "CDEFGHIJ": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "BFGHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BEGHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "B": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BEFHIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "BEFGIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BEFGHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BEFGHIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "F": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "BEFGHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "BEFGHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "H": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "BDGHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BDFHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDFGIJKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDFGHJKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDFGHIKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDFGHIJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BDFGHIJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BDEHIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "BDEGIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BDEGHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BDEGHIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "BDEGHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "BDEGHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "BDEFIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDEFHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDEFHIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDEFHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BDEFHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BDEFGJKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDEFGIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDEFGIJL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BDEFGIJK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BDEFGHKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BDEFGHJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "BDEFGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "BDEFGHIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BDEFGHIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BDEFGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "BCGHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BCFHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCFGIJKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCFGHJKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCFGHIKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCFGHIJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCFGHIJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCEHIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "BCEGIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BCEGHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "BCEGHIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "BCEGHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "BCEGHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "BCEFIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCEFHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCEFHIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCEFHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCEFHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCEFGJKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCEFGIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCEFGIJL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCEFGIJK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCEFGHKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCEFGHJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "BCEFGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "BCEFGHIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCEFGHIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCEFGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "BCDHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDGIJKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDGHJKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDGHIKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDGHIJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "BCDGHIJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "BCDFIJKL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDFHJKL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDFHIKL": {
    "C": 6,
    "I": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDFHIJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCDFHIJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCDFGJKL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDFGIKL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDFGIJL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCDFGIJK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCDFGHKL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDFGHJL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "J": 7
  },
  "BCDFGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "BCDFGHIL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCDFGHIK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCDFGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "BCDEIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDEHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDEHIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDEHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "BCDEHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "BCDEGJKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDEGIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "I": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDEGIJL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "BCDEGIJK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "BCDEGHKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "BCDEGHJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "BCDEGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "E": 15,
    "K": 7
  },
  "BCDEGHIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "BCDEGHIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "H": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "BCDEGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "D": 4,
    "E": 15,
    "I": 7
  },
  "BCDEFJKL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "E": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDEFIKL": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDEFIJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "E": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCDEFIJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "E": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCDEFHKL": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDEFHJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "BCDEFHJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "BCDEFHIL": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCDEFHIK": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCDEFHIJ": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "BCDEFGKL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "E": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "BCDEFGJL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "BCDEFGJK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "BCDEFGIL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "E": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "BCDEFGIK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "E": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "BCDEFGIJ": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "J": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "BCDEFGHL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "BCDEFGHK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "BCDEFGHJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "J": 9,
    "F": 4,
    "D": 15,
    "E": 7
  },
  "BCDEFGHI": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "H": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "AFGHIJKL": {
    "H": 6,
    "J": 12,
    "I": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "AEGHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "A": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "AEFHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "AEFGIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "AEFGHJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "AEFGHIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "AEFGHIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "AEFGHIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ADGHIJKL": {
    "H": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ADFHIJKL": {
    "H": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADFGIJKL": {
    "I": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADFGHJKL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADFGHIKL": {
    "H": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADFGHIJL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ADFGHIJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ADEHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ADEGIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ADEGHJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ADEGHIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ADEGHIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ADEGHIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ADEFIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADEFHJKL": {
    "H": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADEFHIKL": {
    "H": 6,
    "E": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADEFHIJL": {
    "H": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ADEFHIJK": {
    "H": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ADEFGJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADEFGIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADEFGIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ADEFGIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ADEFGHKL": {
    "H": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ADEFGHJL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ADEFGHJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ADEFGHIL": {
    "H": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ADEFGHIK": {
    "H": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ADEFGHIJ": {
    "H": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ACGHIJKL": {
    "H": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ACFHIJKL": {
    "H": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACFGIJKL": {
    "I": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACFGHJKL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACFGHIKL": {
    "H": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACFGHIJL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACFGHIJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACEHIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ACEGIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ACEGHJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ACEGHIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ACEGHIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ACEGHIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ACEFIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACEFHJKL": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACEFHIKL": {
    "H": 6,
    "E": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACEFHIJL": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACEFHIJK": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACEFGJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACEFGIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACEFGIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACEFGIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACEFGHKL": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACEFGHJL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ACEFGHJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ACEFGHIL": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACEFGHIK": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACEFGHIJ": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ACDHIJKL": {
    "H": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDGIJKL": {
    "I": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDGHJKL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDGHIKL": {
    "H": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDGHIJL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDGHIJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDFIJKL": {
    "C": 6,
    "J": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACDFHJKL": {
    "H": 6,
    "J": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDFHIKL": {
    "H": 6,
    "F": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDFHIJL": {
    "H": 6,
    "J": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDFHIJK": {
    "H": 6,
    "J": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDFGJKL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACDFGIKL": {
    "C": 6,
    "G": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACDFGIJL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACDFGIJK": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACDFGHKL": {
    "H": 6,
    "G": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDFGHJL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "H": 7
  },
  "ACDFGHJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "ACDFGHIL": {
    "H": 6,
    "G": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDFGHIK": {
    "H": 6,
    "G": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDFGHIJ": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "ACDEIJKL": {
    "E": 6,
    "J": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEHJKL": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEHIKL": {
    "H": 6,
    "E": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEHIJL": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDEHIJK": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDEGJKL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEGIKL": {
    "E": 6,
    "G": 12,
    "I": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEGIJL": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDEGIJK": {
    "E": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDEGHKL": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEGHJL": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "ACDEGHJK": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "K": 7
  },
  "ACDEGHIL": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDEGHIK": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDEGHIJ": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "I": 7
  },
  "ACDEFJKL": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACDEFIKL": {
    "C": 6,
    "E": 12,
    "I": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACDEFIJL": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACDEFIJK": {
    "C": 6,
    "J": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACDEFHKL": {
    "H": 6,
    "E": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ACDEFHJL": {
    "H": 6,
    "J": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "ACDEFHJK": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "ACDEFHIL": {
    "H": 6,
    "E": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ACDEFHIK": {
    "H": 6,
    "E": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ACDEFHIJ": {
    "H": 6,
    "J": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "ACDEFGKL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ACDEFGJL": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ACDEFGJK": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ACDEFGIL": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ACDEFGIK": {
    "C": 6,
    "G": 12,
    "E": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ACDEFGIJ": {
    "C": 6,
    "G": 12,
    "J": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ACDEFGHL": {
    "H": 6,
    "G": 12,
    "F": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "ACDEFGHK": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "ACDEFGHJ": {
    "H": 6,
    "G": 12,
    "J": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "E": 7
  },
  "ACDEFGHI": {
    "H": 6,
    "G": 12,
    "E": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "ABGHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABFHIJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABFGIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABFGHJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABFGHIKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABFGHIJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABFGHIJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABEHIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABEGIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABEGHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABEGHIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABEGHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "H": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABEGHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "H": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABEFIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABEFHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABEFHIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABEFHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ABEFHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ABEFGJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABEFGIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABEFGIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABEFGIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABEFGHKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABEFGHJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "E": 7
  },
  "ABEFGHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "E": 15,
    "K": 7
  },
  "ABEFGHIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ABEFGHIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ABEFGHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "E": 15,
    "I": 7
  },
  "ABDHIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABDGIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABDGHJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABDGHIKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABDGHIJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABDGHIJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABDFIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDFHJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDFHIKL": {
    "H": 6,
    "I": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDFHIJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABDFHIJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABDFGJKL": {
    "F": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABDFGIKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDFGIJL": {
    "F": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABDFGIJK": {
    "F": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABDFGHKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDFGHJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "J": 7
  },
  "ABDFGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "J": 15,
    "K": 7
  },
  "ABDFGHIL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABDFGHIK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABDFGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "J": 7
  },
  "ABDEIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABDEHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABDEHIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABDEHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ABDEHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ABDEGJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABDEGIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABDEGIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABDEGIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABDEGHKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABDEGHJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "E": 7
  },
  "ABDEGHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "E": 15,
    "K": 7
  },
  "ABDEGHIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ABDEGHIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ABDEGHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "E": 15,
    "I": 7
  },
  "ABDEFJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDEFIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDEFIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABDEFIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABDEFHKL": {
    "H": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDEFHJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ABDEFHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ABDEFHIL": {
    "H": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABDEFHIK": {
    "H": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABDEFHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ABDEFGKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABDEFGJL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "J": 7
  },
  "ABDEFGJK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "J": 15,
    "K": 7
  },
  "ABDEFGIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABDEFGIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABDEFGIJ": {
    "E": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "J": 7
  },
  "ABDEFGHL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ABDEFGHK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ABDEFGHJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "J": 7
  },
  "ABDEFGHI": {
    "H": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ABCHIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABCGIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABCGHJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABCGHIKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABCGHIJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABCGHIJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABCFIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCFHJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCFHIKL": {
    "H": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCFHIJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCFHIJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCFGJKL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABCFGIKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCFGIJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABCFGIJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "F": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABCFGHKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCFGHJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "J": 7
  },
  "ABCFGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "J": 15,
    "K": 7
  },
  "ABCFGHIL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCFGHIK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCFGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "J": 7
  },
  "ABCEIJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "C": 4,
    "L": 15,
    "K": 7
  },
  "ABCEHJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABCEHIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABCEHIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ABCEHIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ABCEGJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABCEGIKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "A": 1,
    "I": 9,
    "C": 4,
    "L": 15,
    "K": 7
  },
  "ABCEGIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABCEGIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABCEGHKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "K": 7
  },
  "ABCEGHJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "E": 7
  },
  "ABCEGHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "E": 15,
    "K": 7
  },
  "ABCEGHIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "L": 15,
    "I": 7
  },
  "ABCEGHIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "H": 4,
    "I": 15,
    "K": 7
  },
  "ABCEGHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "G": 4,
    "E": 15,
    "I": 7
  },
  "ABCEFJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCEFIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCEFIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCEFIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCEFHKL": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCEFHJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ABCEFHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ABCEFHIL": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCEFHIK": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCEFHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ABCEFGKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCEFGJL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "J": 7
  },
  "ABCEFGJK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "J": 15,
    "K": 7
  },
  "ABCEFGIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCEFGIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCEFGIJ": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "J": 7
  },
  "ABCEFGHL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ABCEFGHK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ABCEFGHJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "J": 7
  },
  "ABCEFGHI": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ABCDIJKL": {
    "I": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDHJKL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDHIKL": {
    "H": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDHIJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ABCDHIJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ABCDGJKL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "K": 7
  },
  "ABCDGIKL": {
    "I": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDGIJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "L": 15,
    "I": 7
  },
  "ABCDGIJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "G": 4,
    "I": 15,
    "K": 7
  },
  "ABCDGHKL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDGHJL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "J": 7
  },
  "ABCDGHJK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "J": 15,
    "K": 7
  },
  "ABCDGHIL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ABCDGHIK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ABCDGHIJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "J": 7
  },
  "ABCDFJKL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCDFIKL": {
    "C": 6,
    "I": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCDFIJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCDFIJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCDFHKL": {
    "H": 6,
    "F": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDFHJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "H": 7
  },
  "ABCDFHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "ABCDFHIL": {
    "H": 6,
    "F": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ABCDFHIK": {
    "H": 6,
    "F": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ABCDFHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "ABCDFGKL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCDFGJL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "J": 7
  },
  "ABCDFGJK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "J": 15,
    "K": 7
  },
  "ABCDFGIL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCDFGIK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCDFGIJ": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "J": 7
  },
  "ABCDFGHL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "H": 7
  },
  "ABCDFGHK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "ABCDFGHJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "J": 7
  },
  "ABCDFGHI": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "ABCDEJKL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDEIKL": {
    "E": 6,
    "I": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDEIJL": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ABCDEIJK": {
    "E": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ABCDEHKL": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDEHJL": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "ABCDEHJK": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "K": 7
  },
  "ABCDEHIL": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ABCDEHIK": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ABCDEHIJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "I": 7
  },
  "ABCDEGKL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "K": 7
  },
  "ABCDEGJL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "J": 7
  },
  "ABCDEGJK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "J": 15,
    "K": 7
  },
  "ABCDEGIL": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "I": 7
  },
  "ABCDEGIK": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "K": 7
  },
  "ABCDEGIJ": {
    "E": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "I": 15,
    "J": 7
  },
  "ABCDEGHL": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "ABCDEGHK": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "K": 7
  },
  "ABCDEGHJ": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "J": 7
  },
  "ABCDEGHI": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "E": 15,
    "I": 7
  },
  "ABCDEFKL": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "K": 7
  },
  "ABCDEFJL": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ABCDEFJK": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ABCDEFIL": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "I": 7
  },
  "ABCDEFIK": {
    "C": 6,
    "E": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "I": 15,
    "K": 7
  },
  "ABCDEFIJ": {
    "C": 6,
    "J": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ABCDEFHL": {
    "H": 6,
    "F": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "D": 4,
    "L": 15,
    "E": 7
  },
  "ABCDEFHK": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "K": 7
  },
  "ABCDEFHJ": {
    "H": 6,
    "J": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "E": 7
  },
  "ABCDEFHI": {
    "H": 6,
    "E": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "I": 7
  },
  "ABCDEFGL": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "L": 15,
    "E": 7
  },
  "ABCDEFGK": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "K": 7
  },
  "ABCDEFGJ": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "J": 7
  },
  "ABCDEFGI": {
    "C": 6,
    "G": 12,
    "B": 8,
    "D": 1,
    "A": 9,
    "F": 4,
    "E": 15,
    "I": 7
  },
  "ABCDEFGH": {
    "H": 6,
    "G": 12,
    "B": 8,
    "C": 1,
    "A": 9,
    "F": 4,
    "D": 15,
    "E": 7
  }
};

export type ThirdPlaceSlotResult = {
  slots: Record<string, number>
  usedFallback: boolean
  combinationKey: string
}

/**
 * Resolve which R32 slots the qualified third-place teams fill.
 * @param qualifiedGroups - Array of group letters that qualified (e.g., ["A", "B", "C", "D", "E", "F", "G", "H"])
 * @returns Object with slot assignments and whether fallback was used
 */
export function resolveThirdPlaceSlots(
  qualifiedGroups: string[]
): ThirdPlaceSlotResult {
  // Sort and create combination key
  const sortedGroups = [...qualifiedGroups].sort()
  const combinationKey = sortedGroups.join("")

  // Try to find official mapping
  if (THIRD_PLACE_SLOT_MAPPINGS[combinationKey]) {
    return {
      slots: THIRD_PLACE_SLOT_MAPPINGS[combinationKey],
      usedFallback: false,
      combinationKey,
    }
  }

  // Fallback: simple left-to-right assignment
  console.log(
    `[v0 DEV NOTE] Third-place combination "${combinationKey}" not found in official mappings. Using fallback left-to-right placement.`
  )

  const fallbackSlots: Record<string, number> = {}
  sortedGroups.forEach((group, index) => {
    fallbackSlots[group] = index
  })

  return {
    slots: fallbackSlots,
    usedFallback: true,
    combinationKey,
  }
}

/**
 * Get the default top 8 teams from ranked list.
 */
export function getDefaultQualifiedTeams(
  rankedTeams: RankedThirdPlaceTeam[]
): string[] {
  return rankedTeams.slice(0, 8).map((t) => t.groupLetter)
}
