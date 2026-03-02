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
