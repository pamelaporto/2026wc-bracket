"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SaveBarProps = {
  onSave: (email: string) => void
  progress: { done: number; total: number }
  defaultEmail?: string
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function SaveBar({ onSave, progress, defaultEmail = "" }: SaveBarProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [saved, setSaved] = useState(!!defaultEmail)

  const handleSave = () => {
    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) return
    onSave(trimmed)
    setSaved(true)
  }

  return (
    <div className="savebar">
      <div className="savebar-left">
        <span className="savebar-dot" aria-hidden="true" />
        <span className="savebar-text">
          <strong>{progress.done}</strong> of {progress.total} groups
        </span>
      </div>

      <div className="savebar-right">
        {saved ? (
          <>
            <span className="savebar-saved-label">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              {email}
            </span>
            <button
              type="button"
              className="savebar-edit-btn"
              onClick={() => setSaved(false)}
            >
              Edit
            </button>
          </>
        ) : (
          <>
            <Input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="savebar-input"
            />
            <Button
              onClick={handleSave}
              disabled={!isValidEmail(email)}
              className="savebar-btn"
            >
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
