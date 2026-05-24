"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { Check, Plus } from "lucide-react"
import { computeFlagGradient } from "@/lib/flags"
import type { RankedThirdPlaceTeam } from "@/lib/thirdPlace"

type ThirdPlaceStepProps = {
  teams: RankedThirdPlaceTeam[]
  selectedGroups: Set<string>
  onToggle: (groupLetter: string) => void
  onContinue: () => void
  onReset: () => void
  onBack: () => void
}

const GROUP_ORDER = "ABCDEFGHIJKL".split("")

export function ThirdPlaceStep({
  teams,
  selectedGroups,
  onToggle,
  onContinue,
  onReset,
  onBack,
}: ThirdPlaceStepProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Select glow animation
  const [selectGlowGroup, setSelectGlowGroup] = useState<string | null>(null)
  
  // Sort teams by group letter A→L (stable order)
  const sortedTeams = useMemo(() => {
    const teamMap = new Map(teams.map((t) => [t.groupLetter, t]))
    return GROUP_ORDER.map((letter) => teamMap.get(letter)).filter(Boolean) as RankedThirdPlaceTeam[]
  }, [teams])

  // Selected teams in A→L order — used to populate the chip rail
  const selectedTeamsOrdered = useMemo(
    () => sortedTeams.filter((t) => selectedGroups.has(t.groupLetter)),
    [sortedTeams, selectedGroups]
  )

  const canContinue = selectedGroups.size === 8
  
  // Motion values for ambient breathing
  const breatheY = useMotionValue(0)
  const breatheScale = useMotionValue(1)
  
  // Spring for smooth transitions
  const springConfig = { stiffness: 80, damping: 20, mass: 1 }
  const smoothY = useSpring(breatheY, springConfig)
  const smoothScale = useSpring(breatheScale, springConfig)

  const activeTeam = sortedTeams[activeIndex]

  // Start breathing animation
  useEffect(() => {
    let frame: number
    let start = performance.now()
    
    const loop = (now: number) => {
      const elapsed = (now - start) / 1000
      
      // Slow vertical drift (8s period)
      const yDrift = Math.sin(elapsed * 0.785) * 8
      breatheY.set(yDrift)
      
      // Subtle scale pulse (12s period)
      const scalePulse = 1 + Math.sin(elapsed * 0.523) * 0.015
      breatheScale.set(scalePulse)
      
      frame = requestAnimationFrame(loop)
    }
    
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [breatheY, breatheScale])

  const goToGroup = useCallback((index: number) => {
    if (isAnimating || index === activeIndex) return
    if (index < 0 || index >= sortedTeams.length) return
    
    setIsAnimating(true)
    setActiveIndex(index)
    
    // Allow animation to complete
    setTimeout(() => setIsAnimating(false), 600)
  }, [activeIndex, sortedTeams.length, isAnimating])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isAnimating) return
    
    if (e.deltaY > 30) {
      goToGroup(activeIndex + 1)
    } else if (e.deltaY < -30) {
      goToGroup(activeIndex - 1)
    }
  }, [activeIndex, goToGroup, isAnimating])

  // Toggle with auto-advance
  const handleToggle = useCallback((groupLetter: string) => {
    const wasSelected = selectedGroups.has(groupLetter)
    
    // Call the parent toggle
    onToggle(groupLetter)
    
    // If we're selecting (not deselecting)
    if (!wasSelected) {
      // Show glow pulse
      setSelectGlowGroup(groupLetter)
      setTimeout(() => setSelectGlowGroup(null), 600)
      
      // Auto-advance to next card after brief delay
      setTimeout(() => {
        if (activeIndex < sortedTeams.length - 1) {
          goToGroup(activeIndex + 1)
        }
      }, 400)
    }
  }, [selectedGroups, onToggle, activeIndex, sortedTeams.length, goToGroup])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault()
      goToGroup(activeIndex + 1)
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault()
      goToGroup(activeIndex - 1)
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      // Toggle selection on active card
      const team = sortedTeams[activeIndex]
      if (team) {
        const isSelected = selectedGroups.has(team.groupLetter)
        const isDisabled = !isSelected && selectedGroups.size >= 8
        if (!isDisabled) {
          handleToggle(team.groupLetter)
        }
      }
    }
  }, [activeIndex, goToGroup, sortedTeams, selectedGroups, handleToggle])

  // All hooks above — safe to early-return now
  if (sortedTeams.length === 0) {
    return (
      <div className="group-stack-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: 0 }}>
          No third-place teams found. Please go back and complete your group picks.
        </p>
        <button
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
          onClick={onBack}
        >
          Back to Groups
        </button>
      </div>
    )
  }

  // Get position offset for stack cards
  const getStackPosition = (index: number) => {
    const diff = index - activeIndex

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 10, blur: 0 }
    } else if (diff === -1) {
      return { y: -280, scale: 0.87, opacity: 0.12, zIndex: 5, blur: 6 }
    } else if (diff === 1) {
      return { y: 280, scale: 0.87, opacity: 0.12, zIndex: 5, blur: 6 }
    } else if (diff === -2) {
      return { y: -480, scale: 0.73, opacity: 0.04, zIndex: 2, blur: 10 }
    } else if (diff === 2) {
      return { y: 480, scale: 0.73, opacity: 0.04, zIndex: 2, blur: 10 }
    } else {
      return { y: diff * 200, scale: 0.5, opacity: 0, zIndex: 0, blur: 12 }
    }
  }

  return (
    <div
      ref={containerRef}
      className="group-stack-container"
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Night Stadium Atmosphere - same as group stage */}
      <div className="stadium-ambient" aria-hidden="true" />
      <div className="stadium-glow" aria-hidden="true" />
      <div className="stadium-vignette" aria-hidden="true" />

      {/* Instruction — positioned above the centered card */}
      <div className="stage-instruction" aria-live="polite">
        <p className="stage-instruction-headline">Choose the third-place teams</p>
        <p className="stage-instruction-sub">New in 2026 — 8 of 12 third-place teams advance. Pick yours.</p>
      </div>

      {/* Navigation indicators */}
      <div className="stack-nav">
        <div className="stack-nav-dots">
          {sortedTeams.map((team, i) => {
            const isSelected = selectedGroups.has(team.groupLetter)
            return (
              <button
                key={team.groupLetter}
                className={`stack-nav-dot ${i === activeIndex ? "is-active" : ""} ${isSelected ? "is-locked" : ""}`}
                onClick={() => goToGroup(i)}
                aria-label={`Go to Group ${team.groupLetter}`}
              >
                <span className="stack-nav-dot-label">{team.groupLetter}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* The ceremonial stack - same layout as group stage */}
      <div className="stack-totem">
        {sortedTeams.map((team, index) => {
          const pos = getStackPosition(index)
          const isActive = index === activeIndex
          const isSelected = selectedGroups.has(team.groupLetter)
          const isDisabled = !isSelected && selectedGroups.size >= 8
          
          return (
            <motion.div
              key={team.groupLetter}
              className={`stack-card ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
              initial={false}
              animate={{
                y: pos.y,
                scale: pos.scale,
                opacity: pos.opacity,
                filter: `blur(${pos.blur}px)`,
              }}
              style={{
                zIndex: pos.zIndex,
                y: isActive ? smoothY : pos.y,
                scale: isActive ? smoothScale : pos.scale,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1.2,
              }}
            >
              {/* Card ambient layer */}
              <div className="stack-card-ambient" />
              
              {/* Light edge glow */}
              <div className="stack-card-edge-glow" />
              
              {/* Selected glow overlay */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="tp-stack-selected-glow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Group letter tab */}
              <div className="stack-card-tab">{team.groupLetter}</div>
              
              {/* Select button — top-right, matching Group Stage lock button */}
              {isActive && (
                <div className="stack-lock-slot">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`stack-lock-btn ${isSelected ? "is-locked" : ""}`}
                    onClick={() => !isDisabled && handleToggle(team.groupLetter)}
                    disabled={isDisabled}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Select</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Card content - single team display */}
              <div className="stack-card-inner tp-stack-card-inner">
                <div className="stack-card-label">Group {team.groupLetter} · 3rd Place</div>
                <div className="tp-stack-divider" />

                {/* Team display - centered */}
                <div className="tp-stack-team">
                  <div
                    className="tp-stack-flag"
                    style={{ backgroundImage: computeFlagGradient(team.colors) }}
                  />
                  
                  <span className="tp-stack-team-name">{team.name}</span>
                  <div className="tp-stack-rank">
                    <span className="tp-stack-rank-label">Projected Rank</span>
                    <span className="tp-stack-rank-value">#{team.rank}</span>
                  </div>
                </div>
                
                
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Selection rail — 8 chip slots replace the plain text counter.
           Filled chips show the team's flag gradient + group letter and
           navigate back to that card on click. Ghost slots communicate
           remaining picks without any additional text.                  */}
      <div className="tp-selection-rail" aria-label="Selected teams">
        <div className="tp-chips-row">
          {Array.from({ length: 8 }, (_, i) => {
            const team = selectedTeamsOrdered[i]
            return team ? (
              <motion.button
                key={`chip-${team.groupLetter}`}
                className="tp-selection-chip tp-selection-chip--filled"
                style={{ backgroundImage: computeFlagGradient(team.colors) }}
                onClick={() => goToGroup(sortedTeams.findIndex((t) => t.groupLetter === team.groupLetter))}
                title={`${team.name} · Group ${team.groupLetter}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
              >
                <span className="tp-chip-letter">{team.groupLetter}</span>
              </motion.button>
            ) : (
              <div key={`empty-${i}`} className="tp-selection-chip tp-selection-chip--empty" />
            )
          })}
        </div>
        <span className={`tp-chips-count ${selectedGroups.size === 8 ? "tp-chips-count--complete" : ""}`}>
          {selectedGroups.size} / 8
        </span>
      </div>

    </div>
  )
}
