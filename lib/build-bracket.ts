// lib/build-bracket.ts

import { resolveThirdPlaceSlots } from "@/lib/thirdPlace"

export type TeamUI = {
  id: string
  name: string
  colors?: string[]
  is_placeholder: boolean
  placeholder_options?: { id: string; name: string; colors: string[] }[]
}

export type GroupsState = Record<string, TeamUI[]>

export type QualifiedTeam = {
  id: string
  name: string
  colors: string[]
  groupLetter: string
  position: number // 1, 2, or 3
}

export type Match = {
  id: string
  round: number // 1 = R32, 2 = R16, 3 = QF, 4 = SF, 5 = Final
  position: number // position within the round (0-indexed)
  team1: QualifiedTeam | null
  team2: QualifiedTeam | null
  winner: QualifiedTeam | null
}

export type BracketState = {
  matches: Match[]
  champion: QualifiedTeam | null
}

/**
 * Extract qualified teams from group picks
 * - Top 2 from each group (24 teams)
 * - Best 8 third-place teams (8 teams)
 * Total = 32 teams
 */
export function getQualifiedTeams(groupsUI: GroupsState): {
  firstPlace: QualifiedTeam[]
  secondPlace: QualifiedTeam[]
  thirdPlace: QualifiedTeam[]
} {
  const groupLetters = Object.keys(groupsUI).sort()

  const firstPlace: QualifiedTeam[] = []
  const secondPlace: QualifiedTeam[] = []
  const thirdPlace: QualifiedTeam[] = []

  groupLetters.forEach((letter) => {
    const teams = groupsUI[letter] || []
    
    // Position 1 (index 0) = Group winner
    if (teams[0] && !teams[0].is_placeholder) {
      firstPlace.push({
        id: teams[0].id,
        name: teams[0].name,
        colors: teams[0].colors || ["#6B7280", "#9CA3AF"],
        groupLetter: letter,
        position: 1,
      })
    }

    // Position 2 (index 1) = Runner-up
    if (teams[1] && !teams[1].is_placeholder) {
      secondPlace.push({
        id: teams[1].id,
        name: teams[1].name,
        colors: teams[1].colors || ["#6B7280", "#9CA3AF"],
        groupLetter: letter,
        position: 2,
      })
    }

    // Position 3 (index 2) = Third place candidate
    if (teams[2] && !teams[2].is_placeholder) {
      thirdPlace.push({
        id: teams[2].id,
        name: teams[2].name,
        colors: teams[2].colors || ["#6B7280", "#9CA3AF"],
        groupLetter: letter,
        position: 3,
      })
    }
  })

  return { firstPlace, secondPlace, thirdPlace }
}

/**
 * Rank third-place teams and return top 8
 * For now: alphabetical by group letter (deterministic)
 * Later: can plug in real FIFA tie-breaker logic
 */
export function rankThirdPlaceTeams(thirdPlaceTeams: QualifiedTeam[]): QualifiedTeam[] {
  // Sort by group letter (A-L) for deterministic ordering
  const sorted = [...thirdPlaceTeams].sort((a, b) => 
    a.groupLetter.localeCompare(b.groupLetter)
  )
  
  // Return top 8
  return sorted.slice(0, 8)
}

/**
 * Official FIFA 2026 Round of 32 bracket structure (Matches 73-88)
 * Source: FIFA 2026 Tournament Regulations
 *
 * Key features:
 * - Group winners A, B, D, E, G, I, K, L face third-place teams (no same-group rematches)
 * - Group winners C, F, H, J face specific runners-up
 * - All runners-up are allocated to specific matches
 * - Third-place allocation via official FIFA matrix (lib/thirdPlace.ts)
 */
const R32_PAIRINGS: Array<{ slot1: string; slot2: string }> = [
  // Match 73 (Index 0)
  { slot1: "A2", slot2: "B2" },
  // Match 74 (Index 1) - E1 vs 3rd place from pool
  { slot1: "E1", slot2: "3rd" },
  // Match 75 (Index 2)
  { slot1: "F1", slot2: "C2" },
  // Match 76 (Index 3)
  { slot1: "C1", slot2: "F2" },
  // Match 77 (Index 4) - I1 vs 3rd place from pool
  { slot1: "I1", slot2: "3rd" },
  // Match 78 (Index 5)
  { slot1: "E2", slot2: "I2" },
  // Match 79 (Index 6) - A1 vs 3rd place from pool
  { slot1: "A1", slot2: "3rd" },
  // Match 80 (Index 7) - L1 vs 3rd place from pool
  { slot1: "L1", slot2: "3rd" },
  // Match 81 (Index 8) - D1 vs 3rd place from pool
  { slot1: "D1", slot2: "3rd" },
  // Match 82 (Index 9) - G1 vs 3rd place from pool
  { slot1: "G1", slot2: "3rd" },
  // Match 83 (Index 10)
  { slot1: "K2", slot2: "L2" },
  // Match 84 (Index 11)
  { slot1: "H1", slot2: "J2" },
  // Match 85 (Index 12) - B1 vs 3rd place from pool
  { slot1: "B1", slot2: "3rd" },
  // Match 86 (Index 13)
  { slot1: "D2", slot2: "G2" },
  // Match 87 (Index 14)
  { slot1: "J1", slot2: "H2" },
  // Match 88 (Index 15) - K1 vs 3rd place from pool
  { slot1: "K1", slot2: "3rd" },
]

/**
 * Build the Round of 32 matches using official FIFA allocation
 */
export function buildRoundOf32(qualified: {
  firstPlace: QualifiedTeam[]
  secondPlace: QualifiedTeam[]
  thirdPlace: QualifiedTeam[]
}): Match[] {
  const { firstPlace, secondPlace, thirdPlace } = qualified
  const best8Third = rankThirdPlaceTeams(thirdPlace)

  // Create lookup maps
  const firstByGroup = new Map(firstPlace.map(t => [t.groupLetter, t]))
  const secondByGroup = new Map(secondPlace.map(t => [t.groupLetter, t]))
  const thirdByGroup = new Map(best8Third.map(t => [t.groupLetter, t]))

  // Get official third-place allocation
  const qualifiedGroups = best8Third.map(t => t.groupLetter)
  const allocationResult = resolveThirdPlaceSlots(qualifiedGroups)

  // If fallback was used, we don't have official mapping
  if (allocationResult.usedFallback) {
    console.error(
      `❌ ERROR: Third-place combination "${allocationResult.combinationKey}" not found in official FIFA allocations. ` +
      `The selected 8 third-place teams do not match FIFA's official brackets. Bracket generation failed.`
    )
    // Return matches with nulls to signal the error visibly
    return R32_PAIRINGS.map((_, index) => ({
      id: `r32-${index}`,
      round: 1,
      position: index,
      team1: null,
      team2: null,
      winner: null,
    }))
  }

  // Create reverse mapping: slot index → which group's 3rd place goes there
  // allocation[groupLetter] = slotIndex
  // We need: slotIndex → groupLetter
  const groupBySlotIndex = new Map<number, string>()
  for (const [group, slotIndex] of Object.entries(allocationResult.slots)) {
    groupBySlotIndex.set(Number(slotIndex), group)
  }

  const matches: Match[] = R32_PAIRINGS.map((pairing, index) => {
    const getTeam = (slot: string): QualifiedTeam | null => {
      // Handle "3rd" slots using official allocation
      if (slot === "3rd") {
        const assignedGroup = groupBySlotIndex.get(index)
        if (!assignedGroup) {
          console.error(`No third-place team assigned for match index ${index}`)
          return null
        }
        return thirdByGroup.get(assignedGroup) || null
      }

      // Handle standard slots (A1, C2, etc.)
      const group = slot[0]
      const position = slot[1]

      if (position === "1") {
        return firstByGroup.get(group) || null
      } else if (position === "2") {
        return secondByGroup.get(group) || null
      }

      return null
    }

    return {
      id: `r32-${index}`,
      round: 1,
      position: index,
      team1: getTeam(pairing.slot1),
      team2: getTeam(pairing.slot2),
      winner: null,
    }
  })

  return matches
}

/**
 * Initialize full bracket structure with all rounds
 * R32 (16 matches) -> R16 (8) -> QF (4) -> SF (2) -> Final (1)
 */
export function initializeBracket(groupsUI: GroupsState): BracketState {
  const qualified = getQualifiedTeams(groupsUI)
  const r32Matches = buildRoundOf32(qualified)

  // Create empty matches for subsequent rounds
  const r16Matches: Match[] = Array.from({ length: 8 }, (_, i) => ({
    id: `r16-${i}`,
    round: 2,
    position: i,
    team1: null,
    team2: null,
    winner: null,
  }))

  const qfMatches: Match[] = Array.from({ length: 4 }, (_, i) => ({
    id: `qf-${i}`,
    round: 3,
    position: i,
    team1: null,
    team2: null,
    winner: null,
  }))

  const sfMatches: Match[] = Array.from({ length: 2 }, (_, i) => ({
    id: `sf-${i}`,
    round: 4,
    position: i,
    team1: null,
    team2: null,
    winner: null,
  }))

  const finalMatch: Match = {
    id: "final-0",
    round: 5,
    position: 0,
    team1: null,
    team2: null,
    winner: null,
  }

  return {
    matches: [...r32Matches, ...r16Matches, ...qfMatches, ...sfMatches, finalMatch],
    champion: null,
  }
}

/**
 * Get parent match indices for a given match
 * Returns the two R32/previous-round match indices that feed into this match
 */
function getParentMatchIndices(round: number, position: number): [number, number] | null {
  if (round === 1) return null // R32 has no parents
  
  // Each match is fed by 2 matches from previous round
  // Position i in round N comes from positions 2i and 2i+1 in round N-1
  const parentPos1 = position * 2
  const parentPos2 = position * 2 + 1
  
  return [parentPos1, parentPos2]
}

/**
 * Get the index of the child match (next round)
 */
function getChildMatchIndex(allMatches: Match[], round: number, position: number): number | null {
  if (round >= 5) return null // Final has no child
  
  const childRound = round + 1
  const childPosition = Math.floor(position / 2)
  
  return allMatches.findIndex(m => m.round === childRound && m.position === childPosition)
}

/**
 * Determine if team goes to slot 1 or slot 2 in next round
 */
function getChildSlot(position: number): 1 | 2 {
  return position % 2 === 0 ? 1 : 2
}

/**
 * Update bracket when a winner is selected
 * Also propagates to next rounds and resets downstream if selection changes
 */
export function selectWinner(
  bracket: BracketState,
  matchId: string,
  winnerId: string
): BracketState {
  const matches = [...bracket.matches]
  const matchIndex = matches.findIndex(m => m.id === matchId)
  
  if (matchIndex === -1) return bracket

  const match = { ...matches[matchIndex] }
  const winner = match.team1?.id === winnerId ? match.team1 : match.team2?.id === winnerId ? match.team2 : null

  if (!winner) return bracket

  match.winner = winner
  matches[matchIndex] = match

  // Propagate to next round
  const childIndex = getChildMatchIndex(matches, match.round, match.position)
  
  if (childIndex !== null) {
    const childMatch = { ...matches[childIndex] }
    const slot = getChildSlot(match.position)
    
    const previousWinner = slot === 1 ? childMatch.team1 : childMatch.team2
    
    if (slot === 1) {
      childMatch.team1 = winner
    } else {
      childMatch.team2 = winner
    }
    
    // If the previous winner was different, reset downstream
    if (previousWinner && previousWinner.id !== winner.id) {
      childMatch.winner = null
      matches[childIndex] = childMatch
      
      // Recursively reset all downstream matches
      return resetDownstream(
        { matches, champion: bracket.champion },
        childMatch.id
      )
    }
    
    matches[childIndex] = childMatch
  }

  // Update champion if this is the final
  let champion = bracket.champion
  if (match.round === 5) {
    champion = winner
  }

  return { matches, champion }
}

/**
 * Reset a match and all downstream matches
 */
function resetDownstream(bracket: BracketState, matchId: string): BracketState {
  const matches = [...bracket.matches]
  const matchIndex = matches.findIndex(m => m.id === matchId)
  
  if (matchIndex === -1) return bracket

  const match = { ...matches[matchIndex] }
  
  // If this match had a winner, we need to reset it and propagate
  if (match.winner) {
    match.winner = null
    matches[matchIndex] = match
    
    const childIndex = getChildMatchIndex(matches, match.round, match.position)
    if (childIndex !== null) {
      const childMatch = { ...matches[childIndex] }
      const slot = getChildSlot(match.position)
      
      if (slot === 1) {
        childMatch.team1 = null
      } else {
        childMatch.team2 = null
      }
      childMatch.winner = null
      matches[childIndex] = childMatch
      
      return resetDownstream({ matches, champion: null }, childMatch.id)
    }
  }

  return { matches, champion: match.round === 5 ? null : bracket.champion }
}

/**
 * Get matches for a specific round
 */
export function getMatchesByRound(bracket: BracketState, round: number): Match[] {
  return bracket.matches.filter(m => m.round === round)
}

/**
 * Round labels
 */
export const ROUND_LABELS: Record<number, string> = {
  1: "Round of 32",
  2: "Round of 16",
  3: "Quarter-Finals",
  4: "Semi-Finals",
  5: "Final",
}
