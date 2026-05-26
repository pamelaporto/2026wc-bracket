"use client"

import { useEffect, useState } from "react"

// June 11, 2026 — local midnight (opening day, no specific UTC kickoff in app data)
const TARGET = new Date(2026, 5, 11)

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function getTimeLeft(): TimeLeft {
  const diff = TARGET.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
    expired: false,
  }
}

const pad = (n: number) => String(n).padStart(2, "0")

export function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTime(getTimeLeft())
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  // Don't render on server — avoids hydration mismatch
  if (!time) return null

  if (time.expired) {
    return (
      <div className="ci-countdown">
        <p className="ci-countdown-live">The world is playing.</p>
      </div>
    )
  }

  const units = [
    { value: pad(time.days),    label: "Days" },
    { value: pad(time.hours),   label: "Hrs" },
    { value: pad(time.minutes), label: "Min" },
    { value: pad(time.seconds), label: "Sec" },
  ]

  return (
    <div className="ci-countdown">
      <p className="ci-countdown-heading">Countdown to kickoff</p>
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
    </div>
  )
}
