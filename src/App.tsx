import { Navigation } from './components/Navigation';
import { Hero } from './components/sections/Hero';
import { CheckoutDemo } from './components/sections/CheckoutDemo';
import { Process } from './components/sections/Process';
import { Features } from './components/sections/Features';
import { Reconcile } from './components/sections/Reconcile';
import { PrivacyModel } from './components/sections/PrivacyModel';
import { Integration } from './components/sections/Integration';
import { Access } from './components/sections/Access';
import { Footer } from './components/sections/Footer';
import { useReveal } from './hooks/useReveal';

export default function App() {
  useReveal();

  return (
    <div className="page" data-reveal-root>
      <Navigation />
      <main>
        <Hero />
        <CheckoutDemo />
        <Process />
        <Features />
        <Reconcile />
        <PrivacyModel />
        <div className="section-spacer" aria-hidden="true" />
        <Integration />
        <Access />
      </main>
      <Footer />
    </div>
  );
}
