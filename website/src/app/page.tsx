import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import AppPreview from "@/components/AppPreview";
import PricingSection from "@/components/PricingSection";
import FAQAccordion from "@/components/FAQAccordion";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AppPreview />
      <FeaturesGrid />
      <PricingSection />
      <FAQAccordion />
      <Footer />
    </main>
  );
}
