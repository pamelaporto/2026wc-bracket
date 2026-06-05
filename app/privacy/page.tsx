import Link from "next/link"

export const metadata = {
  title: "Privacy Policy – Futbol Mode",
  description: "Privacy Policy for Futbol Mode, an independent fan-made World Cup 2026 prediction experience.",
}

export default function PrivacyPage() {
  return (
    <div className="privacy-shell">
      <div className="privacy-container">

        <nav className="privacy-nav">
          <Link href="/" className="privacy-back">← Back to Futbol Mode</Link>
        </nav>

        <header className="privacy-header">
          <p className="privacy-brand">FUTBOL MODE</p>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-updated">Last updated: May 2026</p>
        </header>

        {/* Disclaimer */}
        <section className="privacy-disclaimer-box">
          <p>
            Futbol Mode is an independent fan-created experience and is not affiliated with,
            endorsed by, or sponsored by FIFA or the FIFA World Cup.
          </p>
        </section>

        <div className="privacy-body">

          <section className="privacy-section">
            <h2>Your Data Stays on Your Device</h2>
            <p>
              Futbol Mode stores all prediction data — your group picks, bracket selections,
              and third-place choices — locally in your browser using <code>localStorage</code>.
              This data never leaves your device and is not sent to any server.
            </p>
            <p>
              No account is required to use Futbol Mode. We do not collect or store any
              personal information to provide the core experience.
            </p>
          </section>

          <section className="privacy-section">
            <h2>No Payment Information</h2>
            <p>
              Futbol Mode is free to use. We do not collect, process, or store any payment
              or financial information.
            </p>
          </section>

          <section className="privacy-section">
            <h2>Analytics</h2>
            <p>
              We may use privacy-respecting analytics tools to understand general usage
              patterns and improve the experience. This may include aggregate data such as
              page views and feature interactions. No personally identifiable information
              is collected through analytics.
            </p>
          </section>

          <section className="privacy-section">
            <h2>Sharing</h2>
            <p>
              Futbol Mode includes optional sharing features. When you use "Share Your
              Prediction," content is passed to your device's native share dialog or copied
              to your clipboard. Sharing may take you outside of Futbol Mode to third-party
              platforms, which have their own privacy policies.
            </p>
            <p>
              Avoid including sensitive personal information in your prediction name or
              any shared content.
            </p>
          </section>

          <section className="privacy-section">
            <h2>External Links</h2>
            <p>
              Futbol Mode may contain links to external sites. We are not responsible for
              the privacy practices of those sites and encourage you to review their
              policies before sharing information.
            </p>
          </section>

          <section className="privacy-section">
            <h2>Children</h2>
            <p>
              Futbol Mode is intended for general audiences. We do not knowingly collect
              information from children under 13.
            </p>
          </section>

          <section className="privacy-section">
            <h2>Contact</h2>
            <p>
              Questions about this policy? Reach us at{" "}
              <a href="mailto:hello@pamelaporto.com" className="privacy-link">
                hello@pamelaporto.com
              </a>.
            </p>
          </section>

        </div>

        <footer className="privacy-footer">
          <p>Independent fan-made experience. Not affiliated with FIFA.</p>
          <Link href="/" className="privacy-back">← Back to Futbol Mode</Link>
        </footer>

      </div>
    </div>
  )
}
