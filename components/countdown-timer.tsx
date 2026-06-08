"use client"

import { useEffect, useState } from "react"

// World Cup 2026 schedule (UTC times)
const OPENING_KICKOFF = new Date("2026-06-11T19:00:00Z")  // June 11, 3:00 PM ET
const FINAL_KICKOFF = new Date("2026-07-19T19:00:00Z")    // July 19, 3:00 PM ET

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

type CountdownState = "before-opening" | "tournament-active" | "tournament-complete"

function getCurrentState(): CountdownState {
  const now = Date.now()
  if (now < OPENING_KICKOFF.getTime()) {
    return "before-opening"
  } else if (now < FINAL_KICKOFF.getTime()) {
    return "tournament-active"
  } else {
    return "tournament-complete"
  }
}

function getTimeLeft(targetDate: Date): TimeLeft {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
    isComplete: false,
  }
}

const pad = (n: number) => String(n).padStart(2, "0")

export function CountdownTimer() {
  const [state, setState] = useState<CountdownState | null>(null)
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    // Determine current state and get time to appropriate target
    const currentState = getCurrentState()
    setState(currentState)

    const targetDate =
      currentState === "before-opening" ? OPENING_KICKOFF :
      currentState === "tournament-active" ? FINAL_KICKOFF :
      null

    if (targetDate) {
      setTime(getTimeLeft(targetDate))
      const id = setInterval(() => {
        const newState = getCurrentState()
        setState(newState)
        const newTarget =
          newState === "before-opening" ? OPENING_KICKOFF :
          newState === "tournament-active" ? FINAL_KICKOFF :
          null
        setTime(newTarget ? getTimeLeft(newTarget) : { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true })
      }, 1000)
      return () => clearInterval(id)
    }
  }, [])

  // Don't render on server — avoids hydration mismatch
  if (!state || !time) return null

  // Determine primary and secondary labels based on state
  const primaryLabel =
    state === "before-opening" ? "THE WAIT IS ALMOST OVER" :
    state === "tournament-active" ? "TOURNAMENT MODE IS ON" :
    state === "tournament-complete" ? "WORLD CUP 2026 COMPLETE" :
    ""

  const secondaryLabel =
    state === "before-opening" ? "WORLD CUP 2026 BEGINS IN" :
    state === "tournament-active" ? "COUNTDOWN TO THE FINAL" :
    state === "tournament-complete" ? "THE STORY HAS BEEN WRITTEN" :
    ""

  const units = [
    { value: pad(time.days),    label: "Days" },
    { value: pad(time.hours),   label: "Hrs" },
    { value: pad(time.minutes), label: "Min" },
    { value: pad(time.seconds), label: "Sec" },
  ]

  return (
    <div className="ci-countdown">
      <p className="ci-countdown-heading">{primaryLabel}</p>
      <p className="ci-countdown-secondary">{secondaryLabel}</p>
      {state !== "tournament-complete" && (
        <div className="ci-countdown-units" aria-label="Countdown timer">
          {units.map(({ value, label }, i) => (
            <span key={label} className="ci-countdown-group">
              <span className="ci-countdown-unit">
                <span className="ci-countdown-value">{value}</span>
                <span className="ci-countdown-unit-label">{label}</span>
              </span>
              {i < units.length - 1 && (
                <span className="ci-countdown-sep" aria-hidden="true">:</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
