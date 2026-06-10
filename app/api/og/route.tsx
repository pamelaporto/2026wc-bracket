// app/api/og/route.tsx
// Edge function — renders the share card PNG via @vercel/og (next/og)

import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"
import { decodeShareCard, type ShareCard, type ShareTeam } from "@/lib/share"

export const runtime = "edge"

const W = 1200
const H = 630
const BG = "#0f1120"
const ACCENT = "#D6FF87"
const MUTED = "rgba(255,255,255,0.38)"
const CARD_BG = "rgba(255,255,255,0.06)"
const BORDER = "rgba(255,255,255,0.10)"

// Inline flag gradient — same logic as lib/flags.ts, Edge-safe
function flagGradient(colors: string[]): string {
  if (!colors || colors.length === 0) return "linear-gradient(135deg, #555 0%, #333 100%)"
  if (colors.length === 2)
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 48%, ${colors[1]} 52%, ${colors[1]} 100%)`
  if (colors.length === 3)
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 33%, ${colors[1]} 33%, ${colors[1]} 66%, ${colors[2]} 66%, ${colors[2]} 100%)`
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%)`
}

function FlagSwatch({ colors, size = 40 }: { colors: string[]; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 0.7,
        borderRadius: 6,
        background: flagGradient(colors),
        flexShrink: 0,
      }}
    />
  )
}

function TeamRow({ team, size = 40 }: { team: ShareTeam; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <FlagSwatch colors={team.colors} size={size} />
      <span style={{ color: "rgba(255,255,255,0.88)", fontSize: size * 0.48, fontWeight: 600 }}>
        {team.name}
      </span>
    </div>
  )
}

function renderCard(card: ShareCard) {
  const hasFinal = card.finalist1 && card.finalist2
  const hasSemis = card.semis.filter(Boolean).length > 0

  return (
    <div
      style={{
        width: W,
        height: H,
        background: BG,
        display: "flex",
        flexDirection: "column",
        padding: "48px 64px 40px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Top bar: eyebrow + brand */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: ACCENT, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em" }}>
            FUTBOL MODE
          </span>
          <span style={{ color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>
            FIFA WORLD CUP 2026 · MY PROPHECY
          </span>
        </div>
        {/* Decorative accent line */}
        <div style={{ width: 48, height: 3, background: ACCENT, borderRadius: 2 }} />
      </div>

      {/* Main content row */}
      <div style={{ display: "flex", flex: 1, gap: 48 }}>

        {/* LEFT — Champion hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: "0 0 340px",
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: "36px 32px",
            gap: 16,
          }}
        >
          {card.champion ? (
            <>
              <span style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em" }}>
                CHAMPION
              </span>
              <div
                style={{
                  width: 72,
                  height: 52,
                  borderRadius: 10,
                  background: flagGradient(card.champion.colors),
                }}
              />
              <span
                style={{
                  color: "#fff",
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {card.champion.name}
              </span>
              <span style={{ color: ACCENT, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>
                MY PREDICTED WINNER
              </span>
            </>
          ) : (
            <span style={{ color: MUTED, fontSize: 16 }}>Bracket incomplete</span>
          )}
        </div>

        {/* RIGHT — Final + semis */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1, justifyContent: "center" }}>

          {/* Final matchup */}
          {hasFinal && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <span style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em" }}>
                FINAL MATCHUP
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <TeamRow team={card.finalist1!} size={32} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ height: 1, flex: 1, background: BORDER }} />
                  <span style={{ color: MUTED, fontSize: 10, fontWeight: 600 }}>VS</span>
                  <div style={{ height: 1, flex: 1, background: BORDER }} />
                </div>
                <TeamRow team={card.finalist2!} size={32} />
              </div>
            </div>
          )}

          {/* Semi-finalists */}
          {hasSemis && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "16px 24px",
              }}
            >
              <span style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em" }}>
                SEMI-FINALISTS
              </span>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {card.semis.filter(Boolean).map((team, i) =>
                  team ? (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FlagSwatch colors={team.colors} size={22} />
                      <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, fontWeight: 500 }}>
                        {team.name}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* If only champion is known */}
          {!hasFinal && !hasSemis && card.champion && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: MUTED, fontSize: 13 }}>Complete your bracket to reveal the full prediction.</span>
            </div>
          )}
        </div>
      </div>

      {/* Display name row */}
      {card.displayName && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {card.displayName}'s Prediction
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: card.displayName ? 12 : 28,
          paddingTop: 16,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ color: MUTED, fontSize: 11, letterSpacing: "0.06em" }}>futbolmode.com</span>
        <span style={{ color: MUTED, fontSize: 11, letterSpacing: "0.06em" }}>Make your own prediction →</span>
      </div>
    </div>
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const s = searchParams.get("s")

  // Fallback card if no state
  const fallback: ShareCard = {
    champion: null,
    finalist1: null,
    finalist2: null,
    semis: [],
  }

  const card = s ? (decodeShareCard(s) ?? fallback) : fallback

  return new ImageResponse(renderCard(card), {
    width: W,
    height: H,
  })
}
