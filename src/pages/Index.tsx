import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Agents } from '@/components/Agents';
import { Pricing } from '@/components/Pricing';
import { Testimonials } from '@/components/Testimonials';
import { FinalCTA } from '@/components/FinalCTA';
import { Footer } from '@/components/Footer';
import { useMetaPixel } from '@/hooks/useMetaPixel';

const Index = () => {
  const { trackViewContent } = useMetaPixel();

  useEffect(() => {
    trackViewContent({ content_name: 'Landing Page', content_category: 'page' });
    
    // Captura e armazena o ID do afiliado da URL (?ref=ID).
    // Usa a chave 'affiliate_ref' (mesma chave que ChatLanding.tsx e Billing.tsx).
    // Antes este arquivo gravava em 'copymonster_affiliate_id', que Billing.tsx
    // nunca lia — capturas pela homepage eram perdidas. Padronizado para
    // 'affiliate_ref' em todas as páginas.
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('affiliate_ref', ref);
      // Migração: se ainda houver lead antigo sob a chave legacy, move para a
      // nova chave (idempotente — só move se a nova não existir).
      const legacy = localStorage.getItem('copymonster_affiliate_id');
      if (legacy && !localStorage.getItem('affiliate_ref')) {
        localStorage.setItem('affiliate_ref', legacy);
      }
      // Limpa a chave legacy para evitar confusão futura.
      localStorage.removeItem('copymonster_affiliate_id');
    }
  }, [trackViewContent]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Agents />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
