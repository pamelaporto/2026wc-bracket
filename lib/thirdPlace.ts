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
 * FIFA's official third-place combination-to-slot mapping.
 * Keys are sorted group letters of the 8 qualified third-place teams.
 * Values are the Round of 32 slot assignments.
 *
 * IMPORTANT: This mapping may not be final. Update when FIFA publishes official combinations.
 * Format: { "ABCDEFGH": { "A": slotIndex, "B": slotIndex, ... } }
 *
 * The slot indices refer to which R32 match the 3rd-place team from that group faces.
 * For 2026 format with 48 teams, this is a placeholder structure.
 */
export const THIRD_PLACE_SLOT_MAPPINGS: Record<string, Record<string, number>> = {
  // Example mappings - these are placeholders until FIFA publishes official combinations
  // With 12 groups and 8 best third-place teams, there are C(12,8) = 495 possible combinations
  // Below are some example mappings for illustration

  "ABCDEFGH": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 },
  "ABCDEFGI": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, I: 7 },
  "ABCDEFGJ": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, J: 7 },
  "ABCDEFGK": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, K: 7 },
  "ABCDEFGL": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, L: 7 },
  "ABCDEFHI": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, H: 6, I: 7 },
  "ABCDEFHJ": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, H: 6, J: 7 },
  "ABCDEFHK": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, H: 6, K: 7 },
  "ABCDEFHL": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, H: 6, L: 7 },
  "ABCDEFIJ": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, I: 6, J: 7 },
  "ABCDEFIK": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, I: 6, K: 7 },
  "ABCDEFIL": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, I: 6, L: 7 },
  "ABCDEFJK": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, J: 6, K: 7 },
  "ABCDEFJL": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, J: 6, L: 7 },
  "ABCDEFKL": { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, K: 6, L: 7 },
  
  // Add more mappings as needed...
}

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
