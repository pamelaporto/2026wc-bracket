"use client"

import { motion } from "framer-motion"
import { computeFlagGradient } from "@/lib/flags"
import type { Match, QualifiedTeam } from "@/lib/build-bracket"

type BracketCardProps = {
  match: Match
  onSelectWinner: (matchId: string, winnerId: string) => void
  compact?: boolean
  round?: number
}

function TeamSlot({
  team,
  isWinner,
  isLoser,
  canSelect,
  onSelect,
}: {
  team: QualifiedTeam | null
  isWinner: boolean
  isLoser: boolean
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
            animate={{ scale: 1, opacity: 0.65 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          />
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
      className={[
        "bracket-team-slot",
        "bracket-team-slot--selectable",
        isLoser ? "bracket-team-slot--loser" : "",
      ].filter(Boolean).join(" ")}
      onClick={onSelect}
    >
      {content}
    </button>
  )
}

export function BracketCard({ match, onSelectWinner, compact = false, round }: BracketCardProps) {
  const bothPresent  = match.team1 !== null && match.team2 !== null
  const needsPick    = bothPresent && match.winner === null
  const hasWinner    = match.winner !== null

  // A team is the loser when: it exists, the match has a winner, and it isn't the winner
  const team1IsLoser = hasWinner && match.team1 !== null && match.winner?.id !== match.team1.id
  const team2IsLoser = hasWinner && match.team2 !== null && match.winner?.id !== match.team2.id

  return (
    <div
      className={[
        "bracket-card",
        compact   ? "bracket-card--compact" : "",
        needsPick ? "needs-pick"            : "",
        hasWinner ? "has-winner"            : "",
      ].filter(Boolean).join(" ")}
      data-round={round}
    >
      <TeamSlot
        team={match.team1}
        isWinner={match.winner?.id === match.team1?.id}
        isLoser={team1IsLoser}
        canSelect={bothPresent && match.winner?.id !== match.team1?.id}
        onSelect={() => match.team1 && onSelectWinner(match.id, match.team1.id)}
      />
      <div className="bracket-vs"><span>vs</span></div>
      <TeamSlot
        team={match.team2}
        isWinner={match.winner?.id === match.team2?.id}
        isLoser={team2IsLoser}
        canSelect={bothPresent && match.winner?.id !== match.team2?.id}
        onSelect={() => match.team2 && onSelectWinner(match.id, match.team2.id)}
      />
    </div>
  )
}
