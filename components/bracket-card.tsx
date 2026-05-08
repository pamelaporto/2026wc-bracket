"use client"

import { motion } from "framer-motion"
import { computeFlagGradient } from "@/lib/flags"
import type { Match, QualifiedTeam } from "@/lib/build-bracket"

type BracketCardProps = {
  match: Match
  onSelectWinner: (matchId: string, winnerId: string) => void
  compact?: boolean
}

function TeamSlot({
  team,
  isWinner,
  canSelect,
  onSelect,
}: {
  team: QualifiedTeam | null
  isWinner: boolean
  canSelect: boolean
  onSelect: () => void
}) {
  if (!team) {
    return (
      <div className="bracket-team-slot bracket-team-slot--empty">
        <div className="bracket-slot-left" />
        <div className="bracket-slot-center">
          <div className="flag bracket-flag-empty" />
          <span className="bracket-team-name bracket-team-name--empty">TBD</span>
        </div>
        <div className="bracket-slot-right" />
      </div>
    )
  }

  const content = (
    <>
      <div className="bracket-slot-left" />
      <div className="bracket-slot-center">
        <div
          className="flag bracket-flag-size"
          style={{ backgroundImage: computeFlagGradient(team.colors) }}
        />
        <span className="bracket-team-name">{team.name}</span>
      </div>
      <div className="bracket-slot-right">
        {isWinner && (
          <motion.div
            className="bracket-winner-check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>
    </>
  )

  if (!canSelect) {
    return (
      <div className={`bracket-team-slot ${isWinner ? "bracket-team-slot--winner" : ""}`}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="bracket-team-slot bracket-team-slot--selectable"
      onClick={onSelect}
    >
      {content}
    </button>
  )
}

export function BracketCard({ match, onSelectWinner, compact = false }: BracketCardProps) {
  const canSelectTeam1 = match.team1 !== null && match.team2 !== null
  const canSelectTeam2 = match.team1 !== null && match.team2 !== null

  return (
    <div className={`bracket-card ${compact ? "bracket-card--compact" : ""}`}>
      <TeamSlot
        team={match.team1}
        isWinner={match.winner?.id === match.team1?.id}
        canSelect={canSelectTeam1 && match.winner?.id !== match.team1?.id}
        onSelect={() => match.team1 && onSelectWinner(match.id, match.team1.id)}
      />
      <div className="bracket-vs"><span>vs</span></div>
      <TeamSlot
        team={match.team2}
        isWinner={match.winner?.id === match.team2?.id}
        canSelect={canSelectTeam2 && match.winner?.id !== match.team2?.id}
        onSelect={() => match.team2 && onSelectWinner(match.id, match.team2.id)}
      />
    </div>
  )
}
