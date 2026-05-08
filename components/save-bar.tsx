"use client"

import { useState } from "react"
import { CheckCircle2, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SaveBarProps = {
  onSave: (name: string) => void
  progress: { done: number; total: number }
  defaultName?: string
  visible?: boolean
}

export function SaveBar({ onSave, progress, defaultName = "", visible = false }: SaveBarProps) {
  const [name, setName] = useState(defaultName)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setIsSaved(true)
    window.setTimeout(() => setIsSaved(false), 1500)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="savebar-wrapper"
        >
          <div className="savebar">
            <div className="savebar-left">
              <span className="savebar-dot" aria-hidden="true" />
              <span className="savebar-text">
                <strong>{progress.done}</strong> of {progress.total}
              </span>
            </div>

            <div className="savebar-right">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="savebar-input"
              />

              <Button onClick={handleSave} disabled={!name.trim() || isSaved} className="savebar-btn">
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
