"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, GripVertical, Lock, Unlock } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
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

type GroupCardProps = {
  groupLetter: string
  teams: Team[]
  onTeamsReorder: (teams: Team[]) => void
}

type MenuPos = { top: number; left: number; width: number }

export function GroupCard({ groupLetter, teams, onTeamsReorder }: GroupCardProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Only allow one dropdown open at a time (simpler + avoids collisions)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Lock state
  const [isLocked, setIsLocked] = useState(false)
  const [showLockButton, setShowLockButton] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Lock animation ripple state
  const [showLockRipple, setShowLockRipple] = useState(false)

  // Anchors per row so we can position the portal menu
  const anchorRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)

  // Card ref for mouse tracking
  const cardRef = useRef<HTMLDivElement>(null)

  // Mouse position for hover effects (cursor-reactive glow)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  
  // Smooth spring for mouse movement
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)
  
  // Transform mouse position to subtle tilt/glow effects
  const lightX = useTransform(smoothMouseX, [0, 1], ["-20%", "120%"])
  const lightY = useTransform(smoothMouseY, [0, 1], ["-20%", "120%"])
  
  // Hover state for intensity
  const [isHovered, setIsHovered] = useState(false)

  // Handle mouse move for cursor-reactive effects
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    // Reset to center
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [mouseX, mouseY])

  // Show toast with auto-dismiss
  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 2500)
  }, [])

  const handleLockToggle = () => {
    if (isLocked) {
      setIsLocked(false)
      showToast("Group unlocked. Drag to reorder.")
    } else {
      setIsLocked(true)
      // Trigger lock ripple animation
      setShowLockRipple(true)
      setTimeout(() => setShowLockRipple(false), 1200)
      showToast("Group locked. You can unlock anytime.")
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (isLocked) {
      e.preventDefault()
      return
    }
    // Show lock button when user starts dragging
    if (!showLockButton) {
      setShowLockButton(true)
    }
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isLocked) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    if (isLocked) return
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newTeams = [...teams]
    const [draggedTeam] = newTeams.splice(draggedIndex, 1)
    newTeams.splice(dropIndex, 0, draggedTeam)

    onTeamsReorder(newTeams)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => setDraggedIndex(null)

  const toggleDropdown = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  const selectPlayoffTeam = (teamIndex: number, selectedTeam: TeamOption) => {
    const newTeams = [...teams]
    newTeams[teamIndex] = {
      id: selectedTeam.id,
      name: selectedTeam.name,
      colors: selectedTeam.colors,
      is_placeholder: false,
      placeholder_options: undefined,
    }
    onTeamsReorder(newTeams)
    setOpenIndex(null)
  }

  // --- Portal positioning + close behaviors ---
  useEffect(() => {
    if (openIndex === null) {
      setMenuPos(null)
      return
    }

    const update = () => {
      const anchor = anchorRefs.current[openIndex]
      if (!anchor) return
      const r = anchor.getBoundingClientRect()

      setMenuPos({
        top: r.bottom + 6,
        left: r.left,
        width: r.width,
      })
    }

    update()

    // Keep it pinned during scroll (including inside scroll containers)
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null)
    }

    const onPointerDown = (e: PointerEvent) => {
      const anchor = anchorRefs.current[openIndex]
      if (!anchor) return

      const menuEl = document.getElementById(`wc-menu-${groupLetter}-${openIndex}`)
      const target = e.target as Node

      // Click outside anchor + outside menu closes it
      if (menuEl && menuEl.contains(target)) return
      if (anchor.contains(target)) return
      setOpenIndex(null)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)

    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [openIndex, groupLetter])

  return (
    <motion.div
      ref={cardRef}
      className={`group-card group-card--living ${draggedIndex !== null ? "is-dragging" : ""} ${isLocked ? "is-locked" : ""} ${isHovered ? "is-hovered" : ""} ${showLockRipple ? "is-lock-ripple" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Living ambient light layer - always breathing */}
      <div className="card-ambient-layer" aria-hidden="true" />
      
      {/* Cursor-reactive glow layer */}
      <motion.div 
        className="card-glow-layer" 
        aria-hidden="true"
        style={{
          left: lightX,
          top: lightY,
        }}
      />
      
      {/* Lock ripple effect */}
      <AnimatePresence>
        {showLockRipple && (
          <motion.div
            className="card-lock-ripple"
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="group-tab">{groupLetter}</div>

      {/* Lock button - fades in after first drag interaction */}
      <div className="lock-slot">
  <AnimatePresence>
    {showLockButton && (
      <motion.button
        style={{ transformOrigin: "100% 50%" }}
        initial={{ opacity: 1, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.8 }}
        type="button"
        className={`lock-btn ${isLocked ? "is-locked" : ""}`}
        onClick={handleLockToggle}
        aria-label={isLocked ? "Unlock group" : "Lock group"}
      >
        <span className="lock-icon-slot">
          {isLocked ? <Lock className="lock-icon" /> : <Unlock className="lock-icon" />}
        </span>
        <span className="lock-label">{isLocked ? "Locked" : "Lock"}</span>
      </motion.button>
    )}
  </AnimatePresence>
</div>

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lock-toast"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="group-card__inner">
        <div className="group-label">Group {groupLetter}</div>

        {teams.map((team, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={`${groupLetter}-${team.id}-${index}`}
              className={`team-row ${draggedIndex === index ? "dragging" : ""} ${isLocked ? "row-locked" : ""}`}
              draggable={!isLocked}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="drag-handle" aria-hidden="true">
                <GripVertical className="drag-icon" />
              </div>

              <div className="pos-pill">
                {groupLetter}
                {index + 1}
              </div>

              {/* Morph target */}
              <motion.div
                className="flag flag--morph"
                layoutId={`flag-${team.id}`}
                data-flag-id={team.id}
                style={{ backgroundImage: computeFlagGradient(team.colors) }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              />

              {team.is_placeholder ? (
                <div
                  className="dropdown-anchor"
                  ref={(el) => {
                    anchorRefs.current[index] = el
                  }}
                >
                  <button
                    type="button"
                    className="select-btn"
                    onClick={() => toggleDropdown(index)}
                    aria-expanded={isOpen}
                  >
                    <div className="select-wrap">
                      <div className="select-meta">
                        <div className="select-value select-value--placeholder">Pick playoff winner</div>
                      </div>
                      <ChevronDown className="chev" />
                    </div>
                  </button>

                  {/* Menu is rendered in a Portal (not clipped by the card) */}
                  {isOpen && menuPos
                    ? createPortal(
                        <div
                          id={`wc-menu-${groupLetter}-${index}`}
                          className="menu"
                          role="listbox"
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
                              className="menu-item"
                              role="option"
                              onClick={() => selectPlayoffTeam(index, option)}
                            >
                              <motion.div
                                className="menu-flag"
                                layoutId={`flag-${option.id}`}
                                style={{ backgroundImage: computeFlagGradient(option.colors) }}
                              />
                              <span className="menu-name">{option.name}</span>
                            </div>
                          ))}
                        </div>,
                        document.body
                      )
                    : null}
                </div>
              ) : (
                <span className="team-name">{team.name}</span>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
