"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Trophy, ArrowRight } from "lucide-react"
import { BracketCard } from "@/components/bracket-card"
import { computeFlagGradient } from "@/lib/flags"
import { RitualHeader } from "@/components/ritual-header"
import {
  initializeBracket,
  selectWinner,
  getMatchesByRound,
  ROUND_LABELS,
  type BracketState,
} from "@/lib/build-bracket"

const STORAGE_KEY = "wc2026-bracket-draft-v5"
const BRACKET_PICKS_KEY = "wc2026-bracket-picks-v1"
const THIRD_PLACE_KEY = "wc2026-third-place-selection-v1"
const BRACKET_SOURCE_KEY = "wc2026-bracket-source-v1"

// All wc2026-* keys — cleared by "Start Over"
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

type GroupsState = Record<string, any[]>

/* ── Fixed sizing constants ── */
const MATCH_CARD_H = 100 // px, fixed height per match card
const MATCH_GAP_BASE = 32 // px, gap for R32
const COL_WIDTH = 200 // px per round column
const COL_GAP = 48 // px between columns (room for connectors)
const HEADER_H = 36 // sticky round label area

export default function BracketPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [groups, setGroups] = useState<GroupsState | null>(null)
  const [bracket, setBracket] = useState<BracketState | null>(null)

  useEffect(() => {
    // Guard: Third Place must be complete (8 groups selected) before the
    // bracket is accessible. Prevents stale bracket data from bypassing the flow.
    const thirdPlaceRaw = localStorage.getItem(THIRD_PLACE_KEY)
    let thirdPlaceValid = false
    if (thirdPlaceRaw) {
      try {
        const parsed = JSON.parse(thirdPlaceRaw)
        if (Array.isArray(parsed) && parsed.length >= 8) thirdPlaceValid = true
      } catch { /* ignore */ }
    }
    if (!thirdPlaceValid) {
      router.replace("/")
      return // ready stays false → blank screen while redirecting
    }

    const groupData = localStorage.getItem(STORAGE_KEY)
    if (groupData) {
      try { setGroups(JSON.parse(groupData)) } catch { /* ignore */ }
    }
    setReady(true)
  }, [router])

  useEffect(() => {
    if (!groups) return
    const savedPicks = localStorage.getItem(BRACKET_PICKS_KEY)
    if (savedPicks) {
      try { setBracket(JSON.parse(savedPicks)); return } catch { /* ignore */ }
    }
    // Fresh bracket — record which group rankings it was built from.
    // This snapshot is read by app/page.tsx to detect ranking changes.
    localStorage.setItem(BRACKET_SOURCE_KEY, JSON.stringify(groups))
    setBracket(initializeBracket(groups))
  }, [groups])

  useEffect(() => {
    if (bracket && ready) {
      localStorage.setItem(BRACKET_PICKS_KEY, JSON.stringify(bracket))
    }
  }, [bracket, ready])

  const handleSelectWinner = useCallback((matchId: string, winnerId: string) => {
    setBracket((prev) => prev ? selectWinner(prev, matchId, winnerId) : prev)
  }, [])

  // ── Recovery UX ──────────────────────────────────────────────────────────
  const [focusedMatchId, setFocusedMatchId] = useState<string | null>(null)
  const [jumpIdx, setJumpIdx] = useState(0)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Matches where both teams are known but no winner has been picked
  const incompleteMatches = useMemo(() => {
    if (!bracket) return []
    return bracket.matches.filter(
      (m) => m.team1 !== null && m.team2 !== null && m.winner === null
    )
  }, [bracket])

  // Reset jump index when incomplete list changes (e.g. after a pick)
  useEffect(() => {
    setJumpIdx(0)
  }, [incompleteMatches.length])

  const handleJumpToNext = useCallback(() => {
    if (incompleteMatches.length === 0) return
    const idx = jumpIdx % incompleteMatches.length
    const target = incompleteMatches[idx]
    setJumpIdx(idx + 1)

    // Scroll the match card to the center of the viewport
    const el = document.querySelector<HTMLElement>(`[data-match-id="${target.id}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })

    // Apply focus highlight then clear after 1600ms
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    setFocusedMatchId(target.id)
    focusTimerRef.current = setTimeout(() => setFocusedMatchId(null), 1600)
  }, [incompleteMatches, jumpIdx])

  useEffect(() => {
    return () => { if (focusTimerRef.current) clearTimeout(focusTimerRef.current) }
  }, [])
  // ─────────────────────────────────────────────────────────────────────────

  // Build columns: rounds 1-5
  const rounds = useMemo(() => {
    if (!bracket) return []
    return [1, 2, 3, 4, 5].map(r => ({
      round: r,
      label: ROUND_LABELS[r] || `Round ${r}`,
      matches: getMatchesByRound(bracket, r),
    }))
  }, [bracket])

  if (!ready) return null

  if (!groups) {
    return (
      <div className="wc-page" style={{ padding: "40px 28px 60px" }}>
        <div className="bracket-empty">
          <div className="bracket-empty-icon"><Trophy className="w-16 h-16" /></div>
          <h1 className="bracket-empty-title">Knockout Bracket</h1>
          <p className="bracket-empty-text">
            Complete the group stage and third-place selection to generate your knockout bracket.
          </p>
          <Link href="/" className="bracket-empty-link">
            ← Back to Group Stage
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
          <h1 className="bracket-empty-title">Building Bracket…</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="wc-page" style={{ padding: 0, overflow: "hidden" }}>
      <div className="bk-shell">
        {/* Unified header */}
        <RitualHeader
          currentStep="bracket"
          canContinue={false}
          onHome={() => router.push("/")}
          onBack={() => router.back()}
          rightExtra={bracket.champion ? (
            <div className="bk-mini-champion">
              <Trophy className="w-4 h-4" />
              <span>{bracket.champion.name}</span>
            </div>
          ) : undefined}
        />

        {/* Actions — subtle persistent row for returning users */}
        <div className="bk-actions-row">
          <Link href="/my-prediction" className="bk-actions-link">
            My prediction
          </Link>
          <button className="bk-new-prophecy-btn" onClick={clearAllData}>
            New prediction
          </button>
        </div>

        {/* Champion hero card */}
        <AnimatePresence>
          {bracket.champion && (
            <motion.div
              className="bk-champion-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bk-champion-card">
                {/* Glass layers — same recipe as group cards */}
                <div className="bk-champion-card-ambient" />
                <div className="bk-champion-card-edge" />

                {/* Trophy tab — same shape as .stack-card-tab, trophy icon instead of letter */}
                <div className="bk-champion-tab">
                  <Trophy size={22} />
                </div>

                <div className="bk-champion-card-inner">
                  {/* Eyebrow — same treatment as .stack-card-label */}
                  <span className="bk-champion-label">Champion</span>

                  {/* Flag */}
                  <motion.div
                    className="bk-champion-flag"
                    style={{ backgroundImage: computeFlagGradient(bracket.champion.colors) }}
                    animate={{
                      boxShadow: [
                        "0 0 14px rgba(177,247,18,0.12)",
                        "0 0 24px rgba(177,247,18,0.24)",
                        "0 0 14px rgba(177,247,18,0.12)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Name */}
                  <span className="bk-champion-name">{bracket.champion.name}</span>

                  {/* Supporting line */}
                  <span className="bk-champion-sub">Your predicted winner</span>

                  {/* CTAs */}
                  <a href="/wrapped" className="bk-champion-cta">
                    <span>Reveal your prediction</span>
                    <ArrowRight size={15} />
                  </a>

                  <button className="bk-champion-start-over" onClick={clearAllData}>
                    Start over
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Recovery helper pill ──
             Outer motion.div is the fixed overlay — it spans the viewport width
             and flex-centers the pill. The pill itself has no positioning so
             there is zero FM/CSS transform conflict for horizontal centering.    ── */}
        <AnimatePresence>
          {incompleteMatches.length > 0 && (
            <motion.div
              className="bk-recovery-overlay"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="bk-recovery-pill">
                <span className="bk-recovery-count">
                  {incompleteMatches.length} {incompleteMatches.length === 1 ? "match" : "matches"} need{incompleteMatches.length === 1 ? "s" : ""} a winner
                </span>
                <button className="bk-recovery-jump" onClick={handleJumpToNext}>
                  Jump to next
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal scroll bracket */}
        <div className="bk-scroll-area" ref={scrollAreaRef}>
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
                  {/* Sticky round label — brightness scales with round for visual funnel */}
                  <div className="bk-col-header">
                    <span
                      className="bk-col-label"
                      style={{ color: `rgba(255,255,255,${Math.min(0.38 + col.round * 0.13, 0.95)})` }}
                    >
                      {col.label}
                    </span>
                    <span className="bk-col-count">{matchCount}</span>
                  </div>

                  {/* Match cards */}
                  <div
                    className="bk-col-matches"
                    style={{ gap: roundGap, paddingTop: topPad }}
                  >
                    {col.matches.map((match, matchIdx) => (
                      <div
                        key={match.id}
                        className="bk-match-wrap"
                        style={{ height: MATCH_CARD_H }}
                        data-match-id={match.id}
                        data-focused={focusedMatchId === match.id ? "true" : undefined}
                      >
                        <BracketCard
                          match={match}
                          onSelectWinner={handleSelectWinner}
                          compact={col.round >= 3}
                          round={col.round}
                        />

                        {/* Connector lines to next round */}
                        {colIdx < rounds.length - 1 && (
                          <ConnectorLine
                            matchIdx={matchIdx}
                            matchCount={matchCount}
                            cardH={MATCH_CARD_H}
                            gap={roundGap}
                            colGap={COL_GAP}
                            round={col.round}
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
      </div>{/* end bk-shell */}

      <style jsx>{`
        .bk-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding-top: 92px; /* 68px nav clearance + 24px breathing room */
          background: var(--bg-base);
          color: rgba(255, 255, 255, 0.9);
        }

        /* ── Actions row ── */
        .bk-actions-row {
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
          padding: 8px 28px 0;
        }
        .bk-actions-link {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.28);
          font-size: 11px;
          font-family: inherit;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 6px 0;
          transition: color 0.15s ease;
          text-decoration: none;
        }
        .bk-actions-link:hover {
          color: rgba(255, 255, 255, 0.48);
        }
        .bk-new-prophecy-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.22);
          font-size: 11px;
          font-family: inherit;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 6px 0;
          transition: color 0.15s ease;
        }
        .bk-new-prophecy-btn:hover {
          color: rgba(255, 255, 255, 0.48);
        }

        /* ── Champion card "Start over" secondary action ── */
        .bk-champion-start-over {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.25);
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          padding: 4px 0;
          margin-top: 2px;
          letter-spacing: 0.02em;
          transition: color 0.15s ease;
        }
        .bk-champion-start-over:hover {
          color: rgba(255, 255, 255, 0.5);
        }

        /* ── Mini champion badge (rightExtra slot in nav) — status chip, not CTA ── */
        .bk-mini-champion {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(177, 247, 18, 0.05);
          border: 1px solid rgba(177, 247, 18, 0.12);
          color: rgba(177, 247, 18, 0.5);
          font-size: 11px;
          font-weight: 500;
          pointer-events: none;
          user-select: none;
        }

        /* ── Champion Banner (outer centering wrapper) ── */
        .bk-champion-banner {
          flex-shrink: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 64px 24px 0;
        }

        /* ── Champion Card — exact group card glass recipe ── */
        .bk-champion-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(28, 32, 46, 0.92) 0%, rgba(20, 24, 36, 0.84) 100%);
          backdrop-filter: blur(24px) saturate(140%);
          -webkit-backdrop-filter: blur(24px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        /* Ambient layer — same blue radial recipe as group cards */
        .bk-champion-card-ambient {
          position: absolute;
          inset: -50%;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 120% 80% at 30% 20%, rgba(20, 40, 80, 0.4), transparent 60%),
            radial-gradient(ellipse 100% 60% at 70% 80%, rgba(15, 30, 60, 0.3), transparent 50%);
          mix-blend-mode: soft-light;
          opacity: 0.5;
        }

        /* Inner edge — same as active card */
        .bk-champion-card-edge {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 1;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
        }

        /* Trophy tab — exact .stack-card-tab treatment, trophy icon instead of letter */
        .bk-champion-tab {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 52px;
          height: 56px;
          background: #98D523;
          border: none;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          display: grid;
          place-items: center;
          /* color on the native div so Lucide icon inherits via currentColor */
          color: #000000;
          z-index: 5;
        }

        /* Card content — vertical, centered, top-padded to clear tab */
        .bk-champion-card-inner {
          position: relative;
          z-index: 2;
          padding: 76px 36px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }

        /* Eyebrow — same as .stack-card-label */
        .bk-champion-label {
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
          margin-bottom: 4px;
        }

        .bk-champion-flag {
          width: 72px;
          height: 50px;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .bk-champion-name {
          font-size: 34px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.97);
          letter-spacing: -0.03em;
          line-height: 1;
          margin-top: 4px;
        }

        /* Supporting line */
        .bk-champion-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.32);
          letter-spacing: 0.02em;
          margin-bottom: 4px;
        }

        /* Separator — same weight as team row borders */
        .bk-champion-divider {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.07);
          margin: 8px 0 4px;
        }

        /* CTA — reuses .wr-gate-btn: solid lime, dark text */
        .bk-champion-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 10px;
          background: var(--wc-accent);
          border: none;
          color: #0a0f00;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: opacity 0.18s ease;
        }

        .bk-champion-cta:hover {
          opacity: 0.88;
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

        /* ── Recovery overlay — fixed full-width bar, flex-centers the pill.
             The pill has no positioning of its own, so there is zero
             FM-transform / CSS-transform conflict for horizontal centering.   ── */
        .bk-recovery-overlay {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 24px 0 36px;
          flex-shrink: 0;
        }

        /* ── Recovery pill — pure visual styles only ── */
        .bk-recovery-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          width: fit-content;
          padding: 10px 12px 10px 18px;
          border-radius: 999px;
          background: rgba(24, 27, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
          white-space: nowrap;
        }
        .bk-recovery-count {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.78);
          letter-spacing: 0.01em;
        }
        .bk-recovery-jump {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: var(--wc-accent);
          border: none;
          color: #0a0f00;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .bk-recovery-jump:hover {
          opacity: 0.88;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .bk-mini-champion { padding: 4px 8px; font-size: 10px; }
          .bk-champion-banner { padding: 12px 16px 10px; }
          .bk-champion-card-inner { padding: 70px 24px 22px; gap: 6px; }
          .bk-champion-name { font-size: 26px; }
          .bk-champion-flag { width: 56px; height: 40px; }
          .bk-champion-cta { padding: 10px 20px; font-size: 13px; }
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
  round,
}: {
  matchIdx: number
  matchCount: number
  cardH: number
  gap: number
  colGap: number
  round: number
}) {
  // Even-indexed matches connect down to merge point, odd connect up
  const isTop = matchIdx % 2 === 0

  // Distance from card center to merge point (halfway between pair)
  const halfSpan = (cardH + gap) / 2
  const midY = cardH / 2

  // Horizontal stub from card edge to midpoint of gap
  const stubLen = colGap / 2

  // Connector brightness scales with round: R1=0.10, R2=0.13, R3=0.17, R4=0.22, R5=0.28
  const strokeOpacity = Math.min(0.08 + round * 0.04, 0.28)
  const stroke = `rgba(255, 255, 255, ${strokeOpacity})`
  const strokeWidth = round >= 4 ? 1.5 : 1

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
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Vertical line from this card to merge point */}
      {matchCount > 1 && (
        <line
          x1={stubLen}
          y1={midY}
          x2={stubLen}
          y2={isTop ? midY + halfSpan : midY - halfSpan}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {/* Horizontal line from merge point to next column */}
      {matchIdx % 2 === 0 && (
        <line
          x1={stubLen}
          y1={midY + (matchCount > 1 ? halfSpan : 0)}
          x2={colGap}
          y2={midY + (matchCount > 1 ? halfSpan : 0)}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
    </svg>
  )
}
