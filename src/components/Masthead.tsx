import { hero } from "@/content";
import { useActiveSection } from "@/hooks";
import markerSvg from "@/assets/9c781.svg";

export const NAV = [
  { id: "me", label: "00 ME" },
  { id: "attention", label: "01 ATTENTION" },
  { id: "questions", label: "02 QUESTIONS" },
  { id: "now", label: "03 NOW" },
] as const;

const NAV_IDS = NAV.map((n) => n.id);

export default function Masthead() {
  const active = useActiveSection(NAV_IDS);

  return (
    <header id="me" className="relative z-30 px-5 pt-5 md:px-10 md:pt-8">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <a
          href="#me"
          className="font-display text-[16px] leading-normal font-extrabold whitespace-nowrap text-ink"
          aria-label="JOO JOO — back to top"
        >
          JOO JOO
        </a>
        <nav aria-label="Sections" className="w-full md:w-auto">
          <ul className="flex items-start justify-between gap-4 md:gap-12">
            {NAV.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={`group flex flex-col items-start gap-1.5 py-2 text-[10px] leading-normal whitespace-nowrap transition-colors md:py-1 ${
                      isActive ? "text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`h-[1.5px] w-7 bg-lime transition-opacity duration-300 ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="mt-2 h-px bg-line md:mt-3.5" />

      <div className="mt-4 flex items-center justify-between text-[10px] leading-normal md:mt-[25px]">
        <p className="flex items-center gap-2.5 text-muted">
          <img src={markerSvg} alt="" width={6} height={6} className="size-1.5" />
          {hero.location}
        </p>
        <a href="#attention" className="text-muted transition-colors hover:text-ink">
          PAY ATTENTION <span aria-hidden="true">↓</span>
        </a>
      </div>
    </header>
  );
}
