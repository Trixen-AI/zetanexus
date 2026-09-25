import { Navigation } from './components/Navigation';
import { Hero } from './components/sections/Hero';
import { RailStrip } from './components/sections/Rail';
import { Flows } from './components/sections/Flows';
import { Loop } from './components/sections/Loop';
import { Trust } from './components/sections/Trust';
import { Integration } from './components/sections/Integration';
import { Final } from './components/sections/Final';
import { Footer } from './components/sections/Footer';
import { useReveal } from './hooks/useReveal';

/** Registration marks around the viewport: the page frame. */
function Frame() {
  return (
    <div className="frame" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

/**
 * One page, one rail: spend (market), settle (merchant checkout) and earn
 * (zZEC payouts) are presented together, not as three stacked sites.
 */
export default function App() {
  useReveal();

  return (
    <div className="page" data-reveal-root>
      <Frame />
      <Navigation />
      <main>
        <Hero />
        <RailStrip />
        <Flows />
        <Loop />
        <Trust />
        <Integration />
        <Final />
      </main>
      <Footer />
    </div>
  );
}
