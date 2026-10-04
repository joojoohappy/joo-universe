import { contact, footer, now } from "@/content";

const configured = contact.filter((c): c is { label: string; href: string } => !!c.href);

if (import.meta.env.DEV) {
  const missing = contact.filter((c) => !c.href).map((c) => c.label);
  if (missing.length) {
    console.warn(`[JOO] Contact links not configured yet (hidden): ${missing.join(", ")}. Edit src/content.ts.`);
  }
}

export default function Now() {
  return (
    <section id="now" aria-labelledby="now-title" className="relative overflow-clip bg-paper">
      <div className="now-wrap mx-auto px-5 pt-10 pb-8 md:px-10 md:pt-12">
        <h2 id="now-title" className="text-[10px] leading-normal font-normal text-soft">
          03 / NOW
        </h2>
        <div aria-hidden="true" className="mt-2.5 h-px w-10 bg-line" />

        <p
          aria-hidden="true"
          className="now-type font-display leading-none font-extrabold whitespace-nowrap text-ink select-none"
        >
          NOW
        </p>

        <div className="now-grid">
          <div className="now-body">
            <h3 className="font-display text-[28px] leading-tight font-bold text-ink">{now.place}</h3>
            <ul className="mt-1.5 flex flex-col gap-1 text-[12px] leading-normal text-body">
              {now.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li className="text-soft">{now.aside}</li>
            </ul>
          </div>

          {(configured.length > 0 || import.meta.env.DEV) && (
            <ul className="now-links flex flex-col items-start gap-4 text-[13px] leading-normal text-ink">
              {configured.map((link) => {
                const external = /^https?:/.test(link.href);
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
                      className="inline-block py-1 underline-offset-4 transition-colors hover:text-soft hover:underline"
                    >
                      {link.label} <span aria-hidden="true">↗</span>
                      {external && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  </li>
                );
              })}
              {import.meta.env.DEV && configured.length < contact.length && (
                <li className="border border-dashed border-muted px-2 py-1 text-[10px] text-muted">
                  DEV ONLY: add links in src/content.ts
                </li>
              )}
            </ul>
          )}

          <p className="now-footer text-[10px] leading-normal text-soft">{footer}</p>
        </div>
      </div>
    </section>
  );
}
