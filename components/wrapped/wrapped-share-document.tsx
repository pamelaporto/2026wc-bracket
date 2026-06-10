"use client"

import { useState, useCallback } from "react"
import { Share2, RotateCcw, Trophy } from "lucide-react"
import { computeFlagGradient } from "@/lib/flags"
import type { WrappedProfile } from "@/lib/wrapped-engine"
import type { BracketState, QualifiedTeam, GroupsState } from "@/lib/build-bracket"
import { copyToClipboard } from "@/lib/share"

// ─── Reset helper ────────────────────────────────────────────────────────────

const WC_KEYS = [
  "wc2026-bracket-draft-v5",
  "wc2026-third-place-selection-v1",
  "wc2026-third-place-slots-v1",
  "wc2026-bracket-picks-v1",
  "wc2026-wrapped-name-v1",
  "wc2026-wrapped-visited-v1",
  "wc2026-lock-tooltip-dismissed",
  "wc2026-bracket-source-v1",
  "wc2026-flow-step-v1",
]

function clearAllData() {
  WC_KEYS.forEach((k) => localStorage.removeItem(k))
  window.location.href = "/"
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  profile: WrappedProfile
  bracket: BracketState
  groupsState: GroupsState | null
  advancingThirdGroups: Set<string>
  onReplay: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<number, string> = {
  1: "Round of 32",
  2: "Round of 16",
  3: "Quarter-finals",
  4: "Semi-finals",
  5: "Final",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlagSwatch({ colors, size = 18 }: { colors: string[]; size?: number }) {
  return (
    <div
      className="wrs-doc-flag"
      style={{
        width: size,
        height: Math.round(size * 0.68),
        backgroundImage: computeFlagGradient(colors),
      }}
    />
  )
}

function TeamSlot({
  team,
  isWinner,
  isDecided,
}: {
  team: QualifiedTeam | null
  isWinner: boolean
  isDecided: boolean
}) {
  if (!team) {
    return (
      <div className="wrs-doc-team wrs-doc-team--tbd">
        <span className="wrs-doc-team-name">TBD</span>
      </div>
    )
  }
  return (
    <div
      className={`wrs-doc-team${isWinner ? " wrs-doc-team--winner" : isDecided ? " wrs-doc-team--loser" : ""}`}
    >
      <FlagSwatch colors={team.colors} size={13} />
      <span className="wrs-doc-team-name">{team.name}</span>
      {isWinner && <span className="wrs-doc-team-tick" aria-hidden="true">✓</span>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WrappedShareDocument({
  profile,
  bracket,
  groupsState,
  advancingThirdGroups,
  onReplay,
}: Props) {
  const shareMessage = `🏆 Champion: ${profile.champion?.name ?? "TBD"}\n🎭 ${profile.personalityArchetype}\n"${profile.headline}"\n\nPick yours → https://futbolmode.com`

  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My World Cup 2026 Prediction",
          text: shareMessage,
        })
      } catch { /* user cancelled */ }
    } else {
      const ok = await copyToClipboard(shareMessage)
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    }
  }, [shareMessage])

  const timestamp = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // ── Third-place list: advancing first, then rest alphabetically ──
  const thirdPlaceRows = groupsState
    ? Object.entries(groupsState)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([letter, teams]) => {
          const t = teams[2]
          if (!t || t.is_placeholder) return []
          return [{
            id: t.id,
            name: t.name,
            colors: t.colors ?? ["#6B7280", "#9CA3AF"],
            groupLetter: letter,
            advancing: advancingThirdGroups.has(letter),
          }]
        })
        .sort((a, b) => {
          if (a.advancing && !b.advancing) return -1
          if (!a.advancing && b.advancing) return 1
          return 0
        })
    : []

  return (
    <div className="wrs-doc-shell">
      <div className="wrs-doc-scroll">

        {/* ── SECTION 1: Identity header ── */}
        <div className="wrs-doc-identity">
          <span className="wrs-doc-identity-brand">FUTBOL MODE</span>
          <div className="wrs-doc-identity-row">
            <div>
              <h1 className="wrs-doc-identity-name">{profile.displayName}&apos;s Prediction</h1>
              <p className="wrs-doc-identity-meta">
                {timestamp}&ensp;·&ensp;{profile.personalityArchetype}
              </p>
            </div>
            <div className="wrs-doc-champion-pill">
              <FlagSwatch colors={profile.champion.colors} size={20} />
              <span className="wrs-doc-champion-name">{profile.champion.name}</span>
              <Trophy size={12} color="#D6FF87" style={{ opacity: 0.7, flexShrink: 0 }} />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Group Stage ── */}
        {groupsState && (
          <div className="wrs-doc-section">
            <div className="wrs-doc-section-label">Group Stage</div>
            <div className="wrs-doc-groups-grid">
              {Object.entries(groupsState)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, teams]) => (
                  <div key={letter} className="wrs-doc-group-card">
                    <div className="wrs-doc-group-header">Group {letter}</div>
                    <div className="wrs-doc-group-teams">
                      {teams.slice(0, 4).map((team, idx) => {
                        const isFirst = idx === 0
                        const isSecond = idx === 1
                        const isThirdAdvancing = idx === 2 && advancingThirdGroups.has(letter)
                        const advancing = isFirst || isSecond || isThirdAdvancing
                        return (
                          <div
                            key={team.id ?? idx}
                            className={`wrs-doc-group-team${isFirst || isSecond ? " wrs-doc-group-team--advancing" : isThirdAdvancing ? " wrs-doc-group-team--third" : ""}`}
                          >
                            <span className="wrs-doc-group-pos">{idx + 1}</span>
                            {!team.is_placeholder && team.colors && (
                              <FlagSwatch colors={team.colors} size={11} />
                            )}
                            <span className="wrs-doc-group-team-name">
                              {team.is_placeholder ? "—" : team.name}
                            </span>
                            {advancing && !team.is_placeholder && (
                              <span className="wrs-doc-group-adv-dot" aria-hidden="true" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── SECTION 3: Best Third-Place ── */}
        {thirdPlaceRows.length > 0 && (
          <div className="wrs-doc-section">
            <div className="wrs-doc-section-label">Best Third-Place Teams</div>
            <div className="wrs-doc-third-list">
              {thirdPlaceRows.map((team, idx) => (
                <div
                  key={team.id}
                  className={`wrs-doc-third-row${team.advancing ? " wrs-doc-third-row--advancing" : ""}`}
                >
                  <span className="wrs-doc-third-rank">{idx + 1}</span>
                  <FlagSwatch colors={team.colors} size={14} />
                  <span className="wrs-doc-third-name">{team.name}</span>
                  <span className="wrs-doc-third-group">Group {team.groupLetter}</span>
                  {team.advancing && (
                    <span className="wrs-doc-third-badge">Advancing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 4: Knockout Bracket (primary) ── */}
        <div className="wrs-doc-section">
          <div className="wrs-doc-section-label">Knockout Bracket</div>
          <div className="wrs-doc-bracket">
            {[1, 2, 3, 4, 5].map((round) => {
              const matches = bracket.matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.position - b.position)
              if (matches.length === 0) return null
              return (
                <div key={round} className="wrs-doc-round">
                  <div className="wrs-doc-round-header">
                    <span className="wrs-doc-round-label">{ROUND_LABELS[round]}</span>
                    <span className="wrs-doc-round-count">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
                  </div>
                  <div className={`wrs-doc-matches-grid wrs-doc-matches-grid--r${round}`}>
                    {matches.map((match) => (
                      <div key={match.id} className="wrs-doc-match">
                        <TeamSlot
                          team={match.team1}
                          isWinner={!!match.winner && match.winner.id === match.team1?.id}
                          isDecided={!!match.winner}
                        />
                        <div className="wrs-doc-match-divider" />
                        <TeamSlot
                          team={match.team2}
                          isWinner={!!match.winner && match.winner.id === match.team2?.id}
                          isDecided={!!match.winner}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SECTION 5: Insights ── */}
        {profile.insights.length > 0 && (
          <div className="wrs-doc-section">
            <div className="wrs-doc-section-label">Insights</div>
            <div className="wrs-doc-insights">
              {profile.insights.map((insight, idx) => (
                <div key={idx} className="wrs-doc-insight-card">
                  <div className="wrs-doc-insight-label">{insight.label}</div>
                  <div className="wrs-doc-insight-caption">{insight.caption}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="wrs-doc-actions">
          <button className="wrs-doc-share-btn" onClick={handleShare}>
            <Share2 size={15} />
            <span>{copied ? "Copied!" : "Share your prediction"}</span>
          </button>
          <button className="wrs-doc-replay-btn" onClick={onReplay}>
            <RotateCcw size={13} />
            <span>Replay</span>
          </button>
          <button className="wrs-doc-replay-btn" onClick={clearAllData}>
            <span>Create another prediction</span>
          </button>
        </div>

        {/* ── Creator Signature ── */}
        <div className="wrs-doc-creator">
          <img src="/pamela-porto-headshot.jpg" alt="Pamela Porto" className="wrs-doc-creator-image" />
          <div className="wrs-doc-creator-label">FROM THE CREATOR</div>
          <div className="wrs-doc-creator-name">Pamela Porto</div>
          <p className="wrs-doc-creator-text">
            Futbol Mode was created as a side project for World Cup 2026.
          </p>
          <a href="https://www.linkedin.com/in/pamelaporto/" target="_blank" rel="noopener noreferrer" className="wrs-doc-creator-link">
            Connect on LinkedIn
          </a>
        </div>

      </div>
    </div>
  )
}
