import Masthead from "@/components/Masthead";
import Hero from "@/components/Hero";
import Questions from "@/components/Questions";
import Now from "@/components/Now";

export default function App() {
  return (
    <div className="site min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only-focusable fixed top-3 left-3 z-50 bg-ink px-3 py-2 text-[12px] text-paper"
      >
        Skip to content
      </a>
      <Masthead />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Questions />
        <Now />
      </main>
    </div>
  );
}
