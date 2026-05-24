"use client"

import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { computeFlagGradient } from "@/lib/flags"

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupPreview = {
  letter: string
  teams: Array<{ id: string; name: string; colors?: string[] }>
}

type HomeCarouselProps = {
  groups: GroupPreview[]
  onSelect: (letter: string) => void
}

// ─── Fan geometry ─────────────────────────────────────────────────────────────
//
// All cards share the same base position. Each is displaced by x/y/rotate
// computed from a virtual pivot point PIVOT_DIST px below the card centre.
//
//   dx = PIVOT_DIST × sin(angle)
//   dy = PIVOT_DIST × (1 − cos(angle))      ← downward arc from centre
//
const PIVOT_DIST = 598    // px below card centre
const DEG_STEP   = 7.0    // degrees per step
const CENTER_IDX = 6      // balanced centre of a 12-card arc

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeCarousel({ groups, onSelect }: HomeCarouselProps) {
  const [hovered,  setHovered]  = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [exiting,  setExiting]  = useState(false)

  // ── Display order ─────────────────────────────────────────────────────────
  // Rotate the groups array so Group A sits at CENTER_IDX (position 6).
  // Result: [G, H, I, J, K, L, A, B, C, D, E, F]
  //          ← left arc ──────┘ └── right arc →
  const displayGroups = useMemo(() => {
    const aIdx = groups.findIndex(g => g.letter === "A")
    if (aIdx === -1 || groups.length === 0) return groups
    const n     = groups.length
    const shift = ((CENTER_IDX - aIdx) % n + n) % n   // how far right to rotate
    return [...groups.slice(n - shift), ...groups.slice(0, n - shift)]
  }, [groups])

  const handleClick = useCallback((i: number, letter: string) => {
    if (exiting) return
    setSelected(i)
    setExiting(true)
    setTimeout(() => onSelect(letter), 580)
  }, [exiting, onSelect])

  return (
    <motion.div
      className="hc-scene"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {displayGroups.map((group, i) => {
        const off      = i - CENTER_IDX
        const isActive = off === 0
        const isSel    = selected === i
        const isHov    = hovered  === i && !exiting
        const fade     = exiting  && !isSel

        // ── Arc displacement ──────────────────────────────────────────────
        const angle = off * DEG_STEP
        const rad   = (angle * Math.PI) / 180
        const arcX  = PIVOT_DIST * Math.sin(rad)
        const arcY  = PIVOT_DIST * (1 - Math.cos(rad))

        // ── Depth treatment — blur + desaturation replace opacity falloff ─
        // Cards stay solid/physical; distance is conveyed by soft focus,
        // not by making cards translucent.
        const dist       = Math.abs(off)
        const blurPx     = isSel ? 0 : isHov ? 0 : Math.min(4.5, dist * 0.75)
        const satPct     = isSel ? 100 : Math.max(68, 100 - dist * 5)
        const finalFilter = `blur(${blurPx}px) saturate(${satPct}%)`

        // ── Opacity — gentle falloff only; cards remain physical ──────────
        const baseOp = Math.max(0.58, 1 - dist * 0.07)
        const finalOp = fade
          ? 0
          : isHov
          ? Math.min(1, baseOp + 0.06)
          : baseOp

        // ── Scale ─────────────────────────────────────────────────────────
        const baseSc = 1 - dist * 0.022
        const finalSc = isSel
          ? 1.09
          : isHov
          ? Math.min(1.0, baseSc + 0.032)
          : baseSc

        // ── Position / rotation ───────────────────────────────────────────
        const finalX   = isSel ? 0   : arcX
        const finalY   = isSel ? -38 : arcY - (isHov ? 15 : 0)
        const finalRot = isSel ? 0   : angle

        return (
          <motion.div
            key={group.letter}
            layoutId={`group-card-${group.letter}`}
            className={[
              "hc-card",
              "stack-card",
              "stack-card--sm",
              isActive ? "is-active" : "",
            ].filter(Boolean).join(" ")}
            style={{
              zIndex: groups.length - dist + (isSel ? 20 : 0),
              cursor: exiting ? "default" : "pointer",
            }}
            initial={false}
            animate={{
              x:       finalX,
              y:       finalY,
              rotate:  finalRot,
              scale:   finalSc,
              opacity: finalOp,
              filter:  finalFilter,
            }}
            transition={
              exiting
                ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                : { type: "spring", stiffness: 185, damping: 28, mass: 0.9 }
            }
            onHoverStart={() => !exiting && setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => handleClick(i, group.letter)}
          >
            <div className="stack-card-ambient" aria-hidden="true" />
            <div className="stack-card-edge-glow" aria-hidden="true" />

            {/* Tab — identical to Group Stage card: solid lime, dark text */}
            <div className="stack-card-tab">{group.letter}</div>

            <div className="stack-card-inner">
              <div className="stack-card-label">Group {group.letter}</div>

              {group.teams.slice(0, 4).map((team, ti) => (
                <div key={ti} className="stack-team-row">
                  <div className="stack-pos-pill">{group.letter}{ti + 1}</div>
                  <div
                    className="stack-flag"
                    style={{ backgroundImage: computeFlagGradient(team.colors) }}
                  />
                  <span className="stack-team-name">{team.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
