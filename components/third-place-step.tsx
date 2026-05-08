"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { ChevronDown, ChevronUp, Check } from "lucide-react"
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
  
  // Completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  // Select glow animation
  const [selectGlowGroup, setSelectGlowGroup] = useState<string | null>(null)
  
  // Sort teams by group letter A→L (stable order)
  const sortedTeams = useMemo(() => {
    const teamMap = new Map(teams.map((t) => [t.groupLetter, t]))
    return GROUP_ORDER.map((letter) => teamMap.get(letter)).filter(Boolean) as RankedThirdPlaceTeam[]
  }, [teams])

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
      
      // Check if this completes selection (8th team)
      const newSelectedCount = selectedGroups.size + 1
      if (newSelectedCount === 8) {
        // Final selection - show completion modal instead of advancing
        setTimeout(() => setShowCompletionModal(true), 400)
      } else {
        // Auto-advance to next card after brief delay
        setTimeout(() => {
          if (activeIndex < sortedTeams.length - 1) {
            goToGroup(activeIndex + 1)
          }
        }, 400)
      }
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

  // Get position offset for stack cards
  const getStackPosition = (index: number) => {
    const diff = index - activeIndex
    
    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 10, blur: 0 }
    } else if (diff === -1) {
      return { y: -280, scale: 0.85, opacity: 0.5, zIndex: 5, blur: 2 }
    } else if (diff === 1) {
      return { y: 280, scale: 0.85, opacity: 0.5, zIndex: 5, blur: 2 }
    } else if (diff === -2) {
      return { y: -480, scale: 0.7, opacity: 0.2, zIndex: 2, blur: 4 }
    } else if (diff === 2) {
      return { y: 480, scale: 0.7, opacity: 0.2, zIndex: 2, blur: 4 }
    } else {
      return { y: diff * 200, scale: 0.5, opacity: 0, zIndex: 0, blur: 8 }
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

      {/* Progress pill - top right */}
      <div className="tp-progress-pill">
        <span className="tp-progress-pill-text">
          {selectedGroups.size} of 8 selected
        </span>
      </div>
      
      {/* Completion modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            className="tp-completion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              className="tp-completion-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="tp-completion-title">Dark Horses Chosen</h2>
              <p className="tp-completion-text">The surprises are set.</p>
              <p className="tp-completion-hint">Continue to build your bracket.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation indicators */}
      <div className="stack-nav">
        <button 
          className="stack-nav-btn"
          onClick={() => goToGroup(activeIndex - 1)}
          disabled={activeIndex === 0 || isAnimating}
          aria-label="Previous group"
        >
          <ChevronUp className="stack-nav-icon" />
        </button>
        
        <div className="stack-nav-dots">
          {sortedTeams.map((team, i) => {
            const isSelected = selectedGroups.has(team.groupLetter)
            return (
              <button
                key={team.groupLetter}
                className={`stack-nav-dot ${i === activeIndex ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
                onClick={() => goToGroup(i)}
                aria-label={`Go to Group ${team.groupLetter}`}
              >
                <span className="stack-nav-dot-label">{team.groupLetter}</span>
                {isSelected && (
                  <span className="stack-nav-dot-check">
                    <Check className="w-2 h-2" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        
        <button 
          className="stack-nav-btn"
          onClick={() => goToGroup(activeIndex + 1)}
          disabled={activeIndex === sortedTeams.length - 1 || isAnimating}
          aria-label="Next group"
        >
          <ChevronDown className="stack-nav-icon" />
        </button>
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
              
              {/* Select toggle button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`tp-stack-select-btn ${isSelected ? "is-selected" : ""} ${isDisabled ? "is-disabled" : ""} ${selectGlowGroup === team.groupLetter ? "is-glowing" : ""}`}
                onClick={() => !isDisabled && handleToggle(team.groupLetter)}
                disabled={isDisabled}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Selected</span>
                  </>
                ) : (
                  <span>Select</span>
                )}
                {selectGlowGroup === team.groupLetter && (
                  <motion.span
                    className="tp-select-glow-pulse"
                    initial={{ opacity: 0.8, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.8 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </motion.button>

              {/* Card content - single team display */}
              <div className="stack-card-inner tp-stack-card-inner">
                <div className="stack-card-label">Group {team.groupLetter} - 3rd Place</div>
                
                {/* Team display - centered, larger */}
                <div className="tp-stack-team">
                  <motion.div
                    className="tp-stack-flag"
                    layoutId={`tp-flag-${team.id}`}
                    style={{ backgroundImage: computeFlagGradient(team.colors) }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  />
                  
                  <span className="tp-stack-team-name">{team.name}</span>
                  {/* Status indicator */}
                <div className={`tp-stack-status ${isSelected ? "is-selected" : ""}`}>
                  {isSelected ? "Advancing to Round of 32" : "Not selected"}
                </div>
                
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
      
      {/* Bottom counter label */}
      <motion.div 
        className="tp-stack-counter"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="tp-stack-counter-num">{selectedGroups.size}</span>
        <span className="tp-stack-counter-text">of 8 dark horses chosen</span>
      </motion.div>
      
      {/* Inline styles for third-place specific stack additions */}
      <style jsx>{`
        .tp-stack-selected-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
          background: radial-gradient(600px 200px at 50% -20%, rgba(var(--wc-accent-rgb), 0.15), transparent 70%);
          box-shadow: inset 0 0 30px rgba(var(--wc-accent-rgb), 0.08);
        }
        
        .tp-stack-select-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }
        
        .tp-stack-select-btn:hover:not(.is-disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        
        .tp-stack-select-btn.is-selected {
          background: rgba(var(--wc-accent-rgb), 0.2);
          border-color: rgba(var(--wc-accent-rgb), 0.5);
          color: var(--wc-accent);
        }
        
        .tp-stack-select-btn.is-disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        
        .tp-stack-card-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 80px !important;
          padding-bottom: 32px !important;
        }
        
        .tp-stack-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 8px;
        }
        
        .tp-stack-flag {
          width: 24px;
          height:18px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(0, 0, 0, 0.2);
          background-size: cover;
          background-position: center;
        }
        
        .tp-stack-team-name {
          font-size: 22px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.02em;
          text-align: center;
        }
        
        .tp-stack-rank {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
        }
        
        .tp-stack-rank-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .tp-stack-rank-value {
          font-size: 12px;
          font-weight: 800;
          color: var(--wc-accent);
          font-family: var(--font-mono), monospace;
        }
        
        .tp-stack-status {
          margin-top: 12px;
          padding: 8px 16px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
          transition: all 0.3s ease;
        }
        
        .tp-stack-status.is-selected {
          background: rgba(var(--wc-accent-rgb), 0.1);
          border-color: rgba(var(--wc-accent-rgb), 0.3);
          color: var(--wc-accent);
        }
        
        .tp-stack-counter {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 12px;
          background: rgba(10, 15, 25, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
        }
        
        .tp-stack-counter-num {
          font-family: var(--font-mono), monospace;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        
        .tp-stack-counter-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        /* Nav dot selected state */
        :global(.stack-nav-dot.is-selected) {
          position: relative;
        }
        
        .stack-nav-dot-check {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(var(--wc-accent-rgb), 0.85);
          display: grid;
          place-items: center;
        }
        
        :global(.stack-card.is-selected) {
          border-color: rgba(var(--wc-accent-rgb), 0.35) !important;
        }
        
        .tp-progress-pill {
          position: fixed;
          top: 140px;
          right: 24px;
          z-index: 100;
          padding: 8px 14px;
          border-radius: 20px;
          background: rgba(10, 15, 25, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 20px rgba(var(--wc-accent-rgb), 0.08);
        }
        
        .tp-progress-pill-text {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.02em;
        }
        
        /* Completion modal */
        .tp-completion-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          background: rgba(5, 8, 14, 0.85);
          backdrop-filter: blur(8px);
        }
        
        .tp-completion-modal {
          text-align: center;
          padding: 48px 56px;
          border-radius: 20px;
          background: rgba(15, 22, 35, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5), 0 0 80px rgba(var(--wc-accent-rgb), 0.1);
        }
        
        .tp-completion-title {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        
        .tp-completion-text {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }
        
        .tp-completion-hint {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        /* Select button glow pulse */
        .tp-select-glow-pulse {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(var(--wc-accent-rgb), 0.35);
          pointer-events: none;
        }
        
        .tp-stack-select-btn.is-glowing {
          position: relative;
          overflow: visible;
        }
        
        @media (max-width: 768px) {
          .tp-progress-pill {
            top: 100px;
            right: 16px;
            padding: 6px 10px;
          }
          
          .tp-progress-pill-text {
            font-size: 10px;
          }
          
          .tp-completion-modal {
            padding: 32px 40px;
            margin: 0 20px;
          }
          
          .tp-completion-title {
            font-size: 20px;
          }
          
          .tp-completion-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
