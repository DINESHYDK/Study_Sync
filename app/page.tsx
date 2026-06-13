import { AutoPauseVisual, ComparisonSpotlightVisual, FeatureSpotlight, PopupTimerVisual } from "@/components/landing/FeatureSpotlight";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MobileOptimized } from "@/components/landing/MobileOptimized";
import { Navbar } from "@/components/landing/Navbar";
import { Phase2Features } from "@/components/landing/Phase2Features";

export default function HomePage() {
  return (
    <div className="scroll-smooth bg-[#0a0a0f]">
      <Navbar />
      <main className="overflow-x-clip">
        <HeroSection />
        <FeaturesGrid />
        <HowItWorks />
        <Phase2Features />
        <FeatureSpotlight
          body="Whether you slam your laptop shut, your tab crashes, or you just forget, StudySync detects it and pauses your timer the moment you are gone. When you are back, just hit Resume and keep going."
          label="Never Lose a Second"
          points={[
            "Detects browser tab switching",
            "Pauses on laptop lid close or shutdown",
            "Recovers lost session on next login",
            "Works even without internet and syncs on reconnect",
          ]}
          title="Closes automatically. So you do not have to think about it."
          visual={<AutoPauseVisual />}
        />
        <FeatureSpotlight
          body="Pick any friend, pick any date. StudySync shows a full side-by-side breakdown: every session, every task, every subject. One of you wins. No arguments."
          id="compare"
          label="Friendly Competition"
          points={[
            "Compare by total study time",
            "Compare by tasks completed",
            "Choose any past date",
            "Real-time live updates during the day",
          ]}
          reverse
          title="See exactly who is putting in the work."
          visual={<ComparisonSpotlightVisual />}
        />
        <FeatureSpotlight
          body="Pop out a compact timer widget that floats over your browser. Resize it, move it to any corner of your screen, and keep working without keeping the full StudySync tab open."
          label="Stay in Flow"
          points={[
            "Draggable and resizable widget",
            "Consistent with the app design",
            "Pause and Resume right from the popup",
            "Remembers its position across sessions",
          ]}
          title="A floating timer that goes wherever you go."
          visual={<PopupTimerVisual />}
        />
        <MobileOptimized />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
