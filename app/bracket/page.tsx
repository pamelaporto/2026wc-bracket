"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import { BracketCard } from "@/components/bracket-card"
import { computeFlagGradient } from "@/lib/flags"
import {
  initializeBracket,
  selectWinner,
  getMatchesByRound,
  ROUND_LABELS,
  type BracketState,
} from "@/lib/build-bracket"

const STORAGE_KEY = "wc2026-bracket-draft-v5"
const NAME_KEY = "wc2026-bracket-name-v1"
const SAVED_KEY = "wc2026-bracket-saved"
const BRACKET_PICKS_KEY = "wc2026-bracket-picks-v1"

type GroupsState = Record<string, any[]>

/* ── Fixed sizing constants ── */
const MATCH_CARD_H = 88 // px, fixed height per match card
const MATCH_GAP_BASE = 10 // px, gap for R32
const COL_WIDTH = 200 // px per round column
const COL_GAP = 48 // px between columns (room for connectors)
const HEADER_H = 36 // sticky round label area

export default function BracketPage() {
  const [mounted, setMounted] = useState(false)
  const [savedName, setSavedName] = useState("")
  const [isSaved, setIsSaved] = useState(false)
  const [groups, setGroups] = useState<GroupsState | null>(null)
  const [bracket, setBracket] = useState<BracketState | null>(null)

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem(NAME_KEY)
    const saved = localStorage.getItem(SAVED_KEY)
    const groupData = localStorage.getItem(STORAGE_KEY)
    if (name) setSavedName(name)
    if (saved === "true") setIsSaved(true)
    if (groupData) {
      try { setGroups(JSON.parse(groupData)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!groups) return
    const savedPicks = localStorage.getItem(BRACKET_PICKS_KEY)
    if (savedPicks) {
      try { setBracket(JSON.parse(savedPicks)); return } catch { /* ignore */ }
    }
    setBracket(initializeBracket(groups))
  }, [groups])

  useEffect(() => {
    if (bracket && mounted) {
      localStorage.setItem(BRACKET_PICKS_KEY, JSON.stringify(bracket))
    }
  }, [bracket, mounted])

  const handleSelectWinner = useCallback((matchId: string, winnerId: string) => {
    setBracket((prev) => prev ? selectWinner(prev, matchId, winnerId) : prev)
  }, [])

  // Build columns: rounds 1-5
  const rounds = useMemo(() => {
    if (!bracket) return []
    return [1, 2, 3, 4, 5].map(r => ({
      round: r,
      label: ROUND_LABELS[r] || `Round ${r}`,
      matches: getMatchesByRound(bracket, r),
    }))
  }, [bracket])

  if (!mounted) return null

  // Not saved yet
  if (!isSaved || !savedName) {
    return (
      <div className="wc-page" style={{ padding: "40px 28px 60px" }}>
        <div className="bracket-empty">
          <div className="bracket-empty-icon"><Trophy className="w-16 h-16" /></div>
          <h1 className="bracket-empty-title">Knockout Bracket</h1>
          <p className="bracket-empty-text">
            Enter your name and click Save on the group stage to generate your knockout bracket.
          </p>
          <Link href="/" className="bracket-empty-link">
            <ArrowLeft className="w-4 h-4" />
            Back to Group Stage
          </Link>
        </div>
      </div>
    )
  }

  if (!bracket) {
    return (
      <div className="wc-page" style={{ padding: "40px 28px 60px" }}>
        <div className="bracket-empty">
          <div className="bracket-empty-icon"><Trophy className="w-16 h-16" /></div>
          <h1 className="bracket-empty-title">Loading Bracket...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="wc-page" style={{ padding: 0, overflow: "hidden" }}>
      <div className="bk-shell">
        {/* Fixed header */}
        <header className="bk-header">
          <Link href="/" className="bracket-back">
            <ArrowLeft className="w-4 h-4" />
            <span className="bk-back-label">Groups</span>
          </Link>
          <div className="bk-header-center">
            <h1 className="bk-title">{savedName}&apos;s Bracket</h1>
            <p className="bk-subtitle">Click a team to advance them</p>
          </div>
          <div className="bk-header-right">
            {bracket.champion && (
              <div className="bk-mini-champion">
                <Trophy className="w-4 h-4" />
                <span>{bracket.champion.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Champion celebration */}
        <AnimatePresence>
          {bracket.champion && (
            <motion.div
              className="bk-champion-banner"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="bk-champion-glow" />
              <div className="bk-champion-inner">
                <span className="bk-champion-chip">CHAMPION</span>
                <motion.div
                  className="bk-champion-flag"
                  style={{ backgroundImage: computeFlagGradient(bracket.champion.colors) }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255,215,0,0.3)",
                      "0 0 40px rgba(255,215,0,0.5)",
                      "0 0 20px rgba(255,215,0,0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="bk-champion-name">{bracket.champion.name}</span>
                <Trophy className="w-6 h-6 bk-champion-trophy-icon" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal scroll bracket */}
        <div className="bk-scroll-area">
          <div className="bk-track">
            {rounds.map((col, colIdx) => {
              // Calculate spacing so cards vertically center-align to their "parent" pair
              const matchCount = col.matches.length
              const roundGap = MATCH_GAP_BASE * Math.pow(2, col.round - 1) + (MATCH_CARD_H * (Math.pow(2, col.round - 1) - 1))
              const topPad = col.round === 1 ? 0 : (roundGap - MATCH_GAP_BASE) / 2

              return (
                <div
                  key={col.round}
                  className="bk-column"
                  style={{ width: COL_WIDTH }}
                >
                  {/* Sticky round label */}
                  <div className="bk-col-header">
                    <span className="bk-col-label">{col.label}</span>
                    <span className="bk-col-count">{matchCount}</span>
                  </div>

                  {/* Match cards */}
                  <div
                    className="bk-col-matches"
                    style={{ gap: roundGap, paddingTop: topPad }}
                  >
                    {col.matches.map((match, matchIdx) => (
                      <div key={match.id} className="bk-match-wrap" style={{ height: MATCH_CARD_H }}>
                        <BracketCard
                          match={match}
                          onSelectWinner={handleSelectWinner}
                          compact={col.round >= 3}
                        />

                        {/* Connector lines to next round */}
                        {colIdx < rounds.length - 1 && (
                          <ConnectorLine
                            matchIdx={matchIdx}
                            matchCount={matchCount}
                            cardH={MATCH_CARD_H}
                            gap={roundGap}
                            colGap={COL_GAP}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bk-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(180deg, #05080e 0%, #080c14 30%, #0a1018 60%, #060a10 100%);
          color: rgba(255, 255, 255, 0.9);
        }

        /* ── Header ── */
        .bk-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(8, 12, 20, 0.9);
          backdrop-filter: blur(12px);
          z-index: 20;
        }
        .bk-back-label { font-size: 13px; }
        .bk-header-center { text-align: center; flex: 1; }
        .bk-title {
          font-size: 18px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.02em;
        }
        .bk-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 2px;
        }
        .bk-header-right {
          min-width: 100px;
          display: flex;
          justify-content: flex-end;
        }
        .bk-mini-champion {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(255, 215, 0, 0.12);
          border: 1px solid rgba(255, 215, 0, 0.25);
          color: rgba(255, 215, 0, 0.9);
          font-size: 12px;
          font-weight: 700;
        }

        /* ── Champion Banner ── */
        .bk-champion-banner {
          position: relative;
          flex-shrink: 0;
          display: flex;
          justify-content: center;
          padding: 20px 24px;
          z-index: 10;
        }
        .bk-champion-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.12), transparent 70%);
          pointer-events: none;
        }
        .bk-champion-inner {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 28px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.06) 100%);
          border: 1px solid rgba(255, 215, 0, 0.25);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }
        .bk-champion-chip {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 215, 0, 0.85);
          font-weight: 800;
        }
        .bk-champion-flag {
          width: 40px;
          height: 28px;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255, 215, 0, 0.35);
        }
        .bk-champion-name {
          font-size: 18px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.95);
        }
        .bk-champion-trophy-icon {
          color: rgba(255, 215, 0, 0.85);
        }

        /* ── Scroll Area ── */
        .bk-scroll-area {
          flex: 1;
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 0 0 40px;
          scroll-behavior: smooth;
        }
        .bk-scroll-area::-webkit-scrollbar {
          height: 6px;
        }
        .bk-scroll-area::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }
        .bk-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        /* ── Track (the wide inner element) ── */
        .bk-track {
          display: flex;
          align-items: flex-start;
          gap: ${COL_GAP}px;
          padding: 8px 24px 40px;
          min-width: max-content;
        }

        /* ── Column per round ── */
        .bk-column {
          flex-shrink: 0;
        }
        .bk-col-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 8px 0 10px;
        }
        .bk-col-label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
        }
        .bk-col-count {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.25);
          font-family: var(--font-mono), monospace;
        }
        .bk-col-matches {
          display: flex;
          flex-direction: column;
        }

        /* ── Match wrapper (fixed height) ── */
        .bk-match-wrap {
          position: relative;
          flex-shrink: 0;
        }

        /* ── Connector lines ── */
        .bk-connector {
          position: absolute;
          right: -${COL_GAP}px;
          top: 0;
          width: ${COL_GAP}px;
          height: 100%;
          pointer-events: none;
        }
        .bk-connector-h {
          position: absolute;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
        .bk-connector-v {
          position: absolute;
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .bk-header { padding: 12px 16px; }
          .bk-title { font-size: 15px; }
          .bk-back-label { display: none; }
          .bk-mini-champion { padding: 4px 8px; font-size: 10px; }
          .bk-champion-banner { padding: 12px 16px; }
          .bk-champion-inner { padding: 10px 16px; gap: 10px; }
          .bk-champion-name { font-size: 14px; }
          .bk-champion-flag { width: 28px; height: 20px; }
        }
      `}</style>
    </div>
  )
}

/* ── Connector Line Component ── */
function ConnectorLine({
  matchIdx,
  matchCount,
  cardH,
  gap,
  colGap,
}: {
  matchIdx: number
  matchCount: number
  cardH: number
  gap: number
  colGap: number
}) {
  // Even-indexed matches connect down to merge point, odd connect up
  const isTop = matchIdx % 2 === 0
  const pairIdx = Math.floor(matchIdx / 2)

  // Distance from card center to merge point (halfway between pair)
  const halfSpan = (cardH + gap) / 2
  const midY = cardH / 2

  // Horizontal stub from card edge to midpoint of gap
  const stubLen = colGap / 2

  return (
    <svg
      className="bk-connector"
      style={{
        right: -colGap,
        top: 0,
        width: colGap,
        height: cardH,
        overflow: "visible",
      }}
    >
      {/* Horizontal line from card edge to vertical midpoint */}
      <line
        x1={0}
        y1={midY}
        x2={stubLen}
        y2={midY}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={1}
      />
      {/* Vertical line from this card to merge point */}
      {matchCount > 1 && (
        <line
          x1={stubLen}
          y1={midY}
          x2={stubLen}
          y2={isTop ? midY + halfSpan : midY - halfSpan}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={1}
        />
      )}
      {/* Horizontal line from merge point to next column */}
      {matchIdx % 2 === 0 && (
        <line
          x1={stubLen}
          y1={midY + (matchCount > 1 ? halfSpan : 0)}
          x2={colGap}
          y2={midY + (matchCount > 1 ? halfSpan : 0)}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={1}
        />
      )}
    </svg>
  )
}
