"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from "framer-motion"
import { ChevronDown, GripVertical, Lock, Unlock } from "lucide-react"
import { createPortal } from "react-dom"
import { computeFlagGradient } from "@/lib/flags"

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
  onLockedGroupsChange?: (count: number) => void
  /** Letter of the group to display first (e.g. "D" when user clicked Group D on the carousel) */
  initialGroupLetter?: string
}

type MenuPos = { top: number; left: number; width: number }

export function GroupStack({ groups, onTeamsReorder, onLockedGroupsChange, initialGroupLetter }: GroupStackProps) {
  const initialIndex = initialGroupLetter
    ? Math.max(0, groups.findIndex(g => g.letter === initialGroupLetter))
    : 0
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // When entering via the carousel the selected card does a layoutId expand transition.
  // Flag motion.divs inside that card have their own layoutIds and will fly around
  // independently during the expand. Suppress their layoutIds until the card
  // layout animation completes, then restore so drag-to-reorder still works.
  const [cardTransitionDone, setCardTransitionDone] = useState(!initialGroupLetter)

  // Drag state for reordering teams within focused card
  const [draggedTeamIndex, setDraggedTeamIndex] = useState<number | null>(null)

  // Lock states per group
  const [lockedGroups, setLockedGroups] = useState<Set<string>>(new Set())

  // First-time tooltip
  const TOOLTIP_KEY = "wc2026-lock-tooltip-dismissed"
  const [showTooltip, setShowTooltip] = useState(false)

  // Lock glow animation
  const [lockGlowGroup, setLockGlowGroup] = useState<string | null>(null)

  // Drag affordance teaching
  const [wiggleRow, setWiggleRow] = useState<number | null>(null)   // index of row to wiggle
  const [nudgeActive, setNudgeActive] = useState(false)             // inactivity nudge on row 0
  const [hintText, setHintText] = useState<string | null>(null)     // temporary instruction override
  const hasInteractedRef = useRef(false)                            // true once any drag starts
  
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

  const dismissTooltip = () => {
    setShowTooltip(false)
    localStorage.setItem(TOOLTIP_KEY, "1")
  }

  // Show tooltip on first visit
  useEffect(() => {
    if (!localStorage.getItem(TOOLTIP_KEY)) {
      setShowTooltip(true)
      const t = setTimeout(() => dismissTooltip(), 4000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Inactivity nudge — runs once after 4 s if no drag has started
  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasInteractedRef.current) {
        setNudgeActive(true)
        setHintText("Drag teams up or down to rank them")
        setTimeout(() => {
          setNudgeActive(false)
          setHintText(null)
        }, 2400) // 3 × 0.75 s animation cycles
      }
    }, 4000)
    return () => clearTimeout(t)
  }, []) // intentionally run once on mount

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

  // Notify parent when lock count changes
  useEffect(() => {
    onLockedGroupsChange?.(lockedGroups.size)
  }, [lockedGroups, onLockedGroupsChange])

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
      // Dismiss first-time tooltip on first lock
      dismissTooltip()

      // Show glow pulse on lock icon
      setLockGlowGroup(letter)
      setTimeout(() => setLockGlowGroup(null), 600)

      // Auto-advance: circular scan for next unlocked group
      const newLockedCount = lockedGroups.size + 1
      if (newLockedCount < groups.length) {
        setTimeout(() => {
          const n = groups.length
          // Include the group we just locked so we skip it too
          const nowLocked = new Set(lockedGroups)
          nowLocked.add(letter)
          for (let offset = 1; offset <= n; offset++) {
            const nextIndex = (activeIndex + offset) % n
            if (!nowLocked.has(groups[nextIndex].letter)) {
              goToGroup(nextIndex)
              break
            }
          }
        }, 400)
      }
    }
  }, [lockedGroups, groups.length, activeIndex, goToGroup])

  // Click-to-teach handler — fires only on real clicks, not drag ends (HTML5 DnD guarantee)
  const handleRowClick = useCallback((teamIndex: number, isPlaceholder: boolean, isLocked: boolean) => {
    if (isPlaceholder || isLocked) return
    // Dismiss any active nudge
    hasInteractedRef.current = true
    setNudgeActive(false)
    // Wiggle the clicked row
    setWiggleRow(teamIndex)
    setTimeout(() => setWiggleRow(null), 450)
    // Temporarily swap instruction sub-text
    setHintText("Drag to reorder ↕")
    setTimeout(() => setHintText(null), 2000)
  }, [])

  // Drag handlers for team reordering
  const handleDragStart = (e: React.DragEvent, groupLetter: string, index: number) => {
    if (lockedGroups.has(groupLetter)) {
      e.preventDefault()
      return
    }
    hasInteractedRef.current = true
    setNudgeActive(false)
    setHintText(null)
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
      {/* Night Stadium Atmosphere - minimal premium gradients */}
      
      {/* Primary ambient gradient - drifts very slowly */}
      <div className="stadium-ambient" aria-hidden="true" />
      
      {/* Secondary glow - center brightness */}
      <div className="stadium-glow" aria-hidden="true" />
      
      {/* Vignette - corners fall into darkness */}
      <div className="stadium-vignette" aria-hidden="true" />

      {/* Instruction — positioned above the centered card */}
      <div className="stage-instruction" aria-live="polite">
        <p className="stage-instruction-headline">Rank teams in each group</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={hintText ?? "default"}
            className="stage-instruction-sub"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {hintText ?? "Lock your picks when you’re ready."}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Navigation indicators */}
      <div className="stack-nav">
        <div className="stack-nav-dots">
          {groups.map((g, i) => {
            const isLocked = lockedGroups.has(g.letter)
            return (
              <button
                key={g.letter}
                className={`stack-nav-dot ${i === activeIndex ? "is-active" : ""} ${isLocked ? "is-locked" : ""}`}
                onClick={() => goToGroup(i)}
                aria-label={`Go to Group ${g.letter}`}
              >
                <span className="stack-nav-dot-label">{g.letter}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* The ceremonial stack */}
      <div className="stack-totem">
        {groups.map((group, index) => {
          const pos = getStackPosition(index)
          const isActive = index === activeIndex
          const isLocked = lockedGroups.has(group.letter)

          return (
            <motion.div
              key={group.letter}
              layoutId={initialGroupLetter && group.letter === initialGroupLetter
                ? `group-card-${group.letter}`
                : undefined}
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
                layout: { duration: 0.85, ease: [0.23, 1, 0.32, 1] },
              }}
              onLayoutAnimationComplete={() => setCardTransitionDone(true)}
            >
              {/* Card ambient layer - subtle midnight blue */}
              <div className="stack-card-ambient" />
              
              {/* Light edge glow */}
              <div className="stack-card-edge-glow" />

              {/* Group letter tab */}
              <div className="stack-card-tab">{group.letter}</div>
              
              {/* Lock button — always visible on active card */}
              {isActive && (
                <div className="stack-lock-slot">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`stack-lock-btn ${isLocked ? "is-locked" : ""} ${lockGlowGroup === group.letter ? "is-glowing" : ""}`}
                    onClick={() => toggleLock(group.letter)}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span>{isLocked ? "Locked" : "Lock In"}</span>
                    {lockGlowGroup === group.letter && (
                      <motion.span
                        className="stack-lock-glow-pulse"
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.8 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    )}
                  </motion.button>

                  {/* First-time tooltip */}
                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        className="stack-lock-tooltip"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Lock your group when your picks feel right.
                        <button
                          className="stack-lock-tooltip-close"
                          onClick={dismissTooltip}
                          aria-label="Dismiss tip"
                        >×</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                      className={[
                        "stack-team-row",
                        draggedTeamIndex === teamIndex && isActive ? "is-dragging" : "",
                        isLocked ? "is-locked" : "",
                        wiggleRow === teamIndex && isActive ? "is-click-hint" : "",
                        nudgeActive && isActive && teamIndex === 0 ? "is-nudge" : "",
                      ].filter(Boolean).join(" ")}
                      draggable={isActive && !isLocked}
                      onDragStart={(e) => handleDragStart(e, group.letter, teamIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, group.letter, teamIndex)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleRowClick(teamIndex, team.is_placeholder, isLocked)}
                    >
                      <div className="stack-drag-handle">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      <div className="stack-pos-pill">
                        {group.letter}{teamIndex + 1}
                      </div>
                      
                      <motion.div
                        className="stack-flag"
                        layoutId={
                          // Suppress during the card expand transition so flags
                          // don't fly independently. Restored once card settles.
                          cardTransitionDone || group.letter !== initialGroupLetter
                            ? `flag-${team.id}`
                            : undefined
                        }
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
      
      {/* Progress counter — below the centered card */}
      <div className="stack-progress-counter">
        {lockedGroups.size} of {groups.length} Locked
      </div>

      {/* Lock button glow pulse */}
      <style jsx>{`
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
      `}</style>
    </div>
  )
}
