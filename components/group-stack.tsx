"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from "framer-motion"
import { ChevronDown, ChevronUp, GripVertical, Lock, Unlock } from "lucide-react"
import { createPortal } from "react-dom"
import { computeFlagGradient } from "@/lib/flags"
import { Check } from "lucide-react"

type TeamOption = {
  id: string
  name: string
  colors: string[]
}

type Team = {
  id: string
  name: string
  colors?: string[]
  is_placeholder: boolean
  placeholder_options?: TeamOption[]
}

type GroupData = {
  letter: string
  teams: Team[]
}

type GroupStackProps = {
  groups: GroupData[]
  onTeamsReorder: (groupLetter: string, teams: Team[]) => void
}

type MenuPos = { top: number; left: number; width: number }

export function GroupStack({ groups, onTeamsReorder }: GroupStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Drag state for reordering teams within focused card
  const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null)
  
  // Lock states per group
  const [lockedGroups, setLockedGroups] = useState<Set<string>>(new Set())
  const [showLockButton, setShowLockButton] = useState<Set<string>>(new Set())
  
  // Auto-save indicator
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  
  // Completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  // Lock glow animation
  const [lockGlowGroup, setLockGlowGroup] = useState<string | null>(null)
  
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<{ group: string; index: number } | null>(null)
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)
  
  // Motion values for ambient breathing
  const breatheY = useMotionValue(0)
  const breatheScale = useMotionValue(1)
  
  // Spring for smooth transitions
  const springConfig = { stiffness: 80, damping: 20, mass: 1 }
  const smoothY = useSpring(breatheY, springConfig)
  const smoothScale = useSpring(breatheScale, springConfig)

  const activeGroup = groups[activeIndex]

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
    if (index < 0 || index >= groups.length) return
    
    setIsAnimating(true)
    setActiveIndex(index)
    
    // Allow animation to complete
    setTimeout(() => setIsAnimating(false), 600)
  }, [activeIndex, groups.length, isAnimating])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isAnimating) return
    
    if (e.deltaY > 30) {
      goToGroup(activeIndex + 1)
    } else if (e.deltaY < -30) {
      goToGroup(activeIndex - 1)
    }
  }, [activeIndex, goToGroup, isAnimating])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault()
      goToGroup(activeIndex + 1)
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault()
      goToGroup(activeIndex - 1)
    }
  }, [activeIndex, goToGroup])

  // Auto-save trigger - MUST be defined before toggleLock which uses it
  const triggerAutoSave = useCallback(() => {
    // Save to localStorage
    try {
      const saveData = {
        groups: groups.reduce((acc, g) => {
          acc[g.letter] = g.teams.map(t => t.id)
          return acc
        }, {} as Record<string, string[]>),
        locked: [...lockedGroups],
        timestamp: Date.now()
      }
      localStorage.setItem("wc2026-groups-autosave", JSON.stringify(saveData))
      
      // Show saved indicator briefly
      setShowSavedIndicator(true)
      setTimeout(() => setShowSavedIndicator(false), 2000)
    } catch {
      // ignore localStorage errors
    }
  }, [groups, lockedGroups])

  // Lock toggle with auto-advance
  const toggleLock = useCallback((letter: string) => {
    const wasLocked = lockedGroups.has(letter)
    
    setLockedGroups(prev => {
      const next = new Set(prev)
      if (next.has(letter)) {
        next.delete(letter)
      } else {
        next.add(letter)
      }
      return next
    })
    
    // If we're locking (not unlocking)
    if (!wasLocked) {
      // Show glow pulse on lock icon
      setLockGlowGroup(letter)
      setTimeout(() => setLockGlowGroup(null), 600)
      
      // Check if this completes all groups
      const newLockedCount = lockedGroups.size + 1
      if (newLockedCount === groups.length) {
        // Final group - show completion modal instead of advancing
        setTimeout(() => setShowCompletionModal(true), 400)
      } else {
        // Auto-advance to next card after brief delay
        setTimeout(() => {
          if (activeIndex < groups.length - 1) {
            goToGroup(activeIndex + 1)
          }
        }, 400)
      }
      
      // Trigger auto-save
      triggerAutoSave()
    }
  }, [lockedGroups, groups.length, activeIndex, goToGroup, triggerAutoSave])

  // Drag handlers for team reordering
  const handleDragStart = (e: React.DragEvent, groupLetter: string, index: number) => {
    if (lockedGroups.has(groupLetter)) {
      e.preventDefault()
      return
    }
    setShowLockButton(prev => new Set(prev).add(groupLetter))
    setDraggedTeamIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, groupLetter: string, dropIndex: number) => {
    e.preventDefault()
    if (draggedTeamIndex === null || draggedTeamIndex === dropIndex) return
    if (lockedGroups.has(groupLetter)) return
    
    const group = groups.find(g => g.letter === groupLetter)
    if (!group) return
    
    const newTeams = [...group.teams]
    const [draggedTeam] = newTeams.splice(draggedTeamIndex, 1)
    newTeams.splice(dropIndex, 0, draggedTeam)
    
    onTeamsReorder(groupLetter, newTeams)
    setDraggedTeamIndex(null)
    
    // Auto-save after reorder
    triggerAutoSave()
  }

  const handleDragEnd = () => setDraggedTeamIndex(null)

  // Dropdown handlers
  const toggleDropdown = (groupLetter: string, index: number) => {
    if (openDropdown?.group === groupLetter && openDropdown?.index === index) {
      setOpenDropdown(null)
    } else {
      setOpenDropdown({ group: groupLetter, index })
    }
  }

  const selectPlayoffTeam = (groupLetter: string, teamIndex: number, selectedTeam: TeamOption) => {
    const group = groups.find(g => g.letter === groupLetter)
    if (!group) return
    
    const newTeams = [...group.teams]
    newTeams[teamIndex] = {
      id: selectedTeam.id,
      name: selectedTeam.name,
      colors: selectedTeam.colors,
      is_placeholder: false,
      placeholder_options: undefined,
    }
    onTeamsReorder(groupLetter, newTeams)
    setOpenDropdown(null)
  }

  // Dropdown positioning
  useEffect(() => {
    if (!openDropdown) {
      setMenuPos(null)
      return
    }
    
    const key = `${openDropdown.group}-${openDropdown.index}`
    const anchor = anchorRefs.current[key]
    if (!anchor) return
    
    const update = () => {
      const r = anchor.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null)
    }
    
    const onPointerDown = (e: PointerEvent) => {
      const menuEl = document.getElementById(`stack-menu-${openDropdown.group}-${openDropdown.index}`)
      if (menuEl?.contains(e.target as Node)) return
      if (anchor.contains(e.target as Node)) return
      setOpenDropdown(null)
    }
    
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [openDropdown])

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
      {/* Night Stadium Atmosphere - minimal premium gradients */}
      
      {/* Primary ambient gradient - drifts very slowly */}
      <div className="stadium-ambient" aria-hidden="true" />
      
      {/* Secondary glow - center brightness */}
      <div className="stadium-glow" aria-hidden="true" />
      
      {/* Vignette - corners fall into darkness */}
      <div className="stadium-vignette" aria-hidden="true" />

      {/* Progress pill - top right */}
      <div className="stack-progress-pill">
        <span className="stack-progress-pill-text">
          {lockedGroups.size} of {groups.length} groups locked
        </span>
      </div>
      
      {/* Auto-save indicator */}
      <AnimatePresence>
        {showSavedIndicator && (
          <motion.div
            className="stack-saved-indicator"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            Saved
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Completion modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            className="stack-completion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              className="stack-completion-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="stack-completion-title">All Groups Locked</h2>
              <p className="stack-completion-text">Your World Cup is taking shape.</p>
              <p className="stack-completion-hint">Continue when you&apos;re ready.</p>
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
  {groups.map((g, i) => {
    const isLocked = lockedGroups.has(g.letter)

    return (
      <button
        key={g.letter}
        className={`stack-nav-dot ${i === activeIndex ? "is-active" : ""} ${isLocked ? "is-selected" : ""}`}
        onClick={() => goToGroup(i)}
        aria-label={`Go to Group ${g.letter}`}
      >
        <span className="stack-nav-dot-label">{g.letter}</span>

        {isLocked && (
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
          disabled={activeIndex === groups.length - 1 || isAnimating}
          aria-label="Next group"
        >
          <ChevronDown className="stack-nav-icon" />
        </button>
      </div>

      {/* The ceremonial stack */}
      <div className="stack-totem">
        {groups.map((group, index) => {
          const pos = getStackPosition(index)
          const isActive = index === activeIndex
          const isLocked = lockedGroups.has(group.letter)
          const showLock = showLockButton.has(group.letter)
          
          return (
            <motion.div
              key={group.letter}
              className={`stack-card ${isActive ? "is-active" : ""} ${isLocked ? "is-locked" : ""}`}
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
              {/* Card ambient layer - subtle midnight blue */}
              <div className="stack-card-ambient" />
              
              {/* Light edge glow */}
              <div className="stack-card-edge-glow" />

              {/* Group letter tab */}
              <div className="stack-card-tab">{group.letter}</div>
              
              {/* Lock button */}
              {showLock && isActive && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`stack-lock-btn ${isLocked ? "is-locked" : ""} ${lockGlowGroup === group.letter ? "is-glowing" : ""}`}
                  onClick={() => toggleLock(group.letter)}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span>{isLocked ? "Locked" : "Lock"}</span>
                  {lockGlowGroup === group.letter && (
                    <motion.span
                      className="stack-lock-glow-pulse"
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.8 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  )}
                </motion.button>
              )}

              {/* Card content */}
              <div className="stack-card-inner">
                <div className="stack-card-label">Group {group.letter}</div>
                
                {group.teams.map((team, teamIndex) => {
                  const isDropdownOpen = openDropdown?.group === group.letter && openDropdown?.index === teamIndex
                  const anchorKey = `${group.letter}-${teamIndex}`
                  
                  return (
                    <div
                      key={`${group.letter}-${team.id}-${teamIndex}`}
                      className={`stack-team-row ${draggedTeamIndex === teamIndex && isActive ? "is-dragging" : ""} ${isLocked ? "is-locked" : ""}`}
                      draggable={isActive && !isLocked}
                      onDragStart={(e) => handleDragStart(e, group.letter, teamIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, group.letter, teamIndex)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="stack-drag-handle">
                        <GripVertical className="w-4 h-4 opacity-40" />
                      </div>
                      
                      <div className="stack-pos-pill">
                        {group.letter}{teamIndex + 1}
                      </div>
                      
                      <motion.div
                        className="stack-flag"
                        layoutId={`flag-${team.id}`}
                        style={{ backgroundImage: computeFlagGradient(team.colors) }}
                        transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      />
                      
                      {team.is_placeholder ? (
                        <div
                          className="stack-dropdown-anchor"
                          ref={(el) => { anchorRefs.current[anchorKey] = el }}
                        >
                          <button
                            type="button"
                            className="stack-select-btn"
                            onClick={() => isActive && toggleDropdown(group.letter, teamIndex)}
                          >
                            <span className="stack-select-placeholder">Pick playoff winner</span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </button>
                          
                          {isDropdownOpen && menuPos && createPortal(
                            <div
                              id={`stack-menu-${group.letter}-${teamIndex}`}
                              className="stack-menu"
                              style={{
                                position: "fixed",
                                top: menuPos.top,
                                left: menuPos.left,
                                width: menuPos.width,
                                zIndex: 9999,
                              }}
                            >
                              {team.placeholder_options?.map((option) => (
                                <div
                                  key={option.id}
                                  className="stack-menu-item"
                                  onClick={() => selectPlayoffTeam(group.letter, teamIndex, option)}
                                >
                                  <motion.div
                                    className="stack-menu-flag"
                                    layoutId={`flag-${option.id}`}
                                    style={{ backgroundImage: computeFlagGradient(option.colors) }}
                                  />
                                  <span>{option.name}</span>
                                </div>
                              ))}
                            </div>,
                            document.body
                          )}
                        </div>
                      ) : (
                        <span className="stack-team-name">{team.name}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Current group indicator */}
      
      
      {/* Inline styles for progress indicators */}
      <style jsx>{`
        .stack-progress-pill {
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
        
        .stack-progress-pill-text {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.02em;
        }
        
        .stack-saved-indicator {
          position: fixed;
          top: 140px;
          right: 180px;
          z-index: 100;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(var(--wc-accent-rgb), 0.18);
          border: 1px solid rgba(var(--wc-accent-rgb), 0.3);
          font-size: 11px;
          font-weight: 600;
          color: var(--wc-accent);
          letter-spacing: 0.04em;
        }
        
        /* Completion modal */
        .stack-completion-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          background: rgba(5, 8, 14, 0.85);
          backdrop-filter: blur(8px);
        }
        
        .stack-completion-modal {
          text-align: center;
          padding: 48px 56px;
          border-radius: 20px;
          background: rgba(15, 22, 35, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5), 0 0 80px rgba(var(--wc-accent-rgb), 0.1);
        }
        
        .stack-completion-title {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        
        .stack-completion-text {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }
        
        .stack-completion-hint {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        /* Lock button glow pulse */
        .stack-lock-glow-pulse {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(var(--wc-accent-rgb), 0.35);
          pointer-events: none;
        }
        
        :global(.stack-lock-btn.is-glowing) {
          position: relative;
          overflow: visible;
        }
        
        @media (max-width: 768px) {
          .stack-progress-pill {
            top: 100px;
            right: 16px;
            padding: 6px 10px;
          }
          
          .stack-progress-pill-text {
            font-size: 10px;
          }
          
          .stack-saved-indicator {
            top: 100px;
            right: 140px;
            padding: 4px 8px;
            font-size: 9px;
          }
          
          .stack-completion-modal {
            padding: 32px 40px;
            margin: 0 20px;
          }
          
          .stack-completion-title {
            font-size: 20px;
          }
          
          .stack-completion-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
