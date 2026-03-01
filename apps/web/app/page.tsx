import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/Button";
import { StepCard } from "../components/ui/StepCard";
import { ValueCard } from "../components/ui/ValueCard";
import { ScreenshotPlaceholder } from "../components/ui/ScreenshotPlaceholder";
import { Footer } from "../components/Footer";

export default async function Home() {
  // Always show landing page - don't auto-redirect logged in users
  // Users can manually navigate to dashboard if they want
  return (
    <div className="min-h-screen bg-emerald-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 pt-24 pb-20">
        {/* Decorative geometric pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 border-4 border-emerald-600 rotate-45"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-gold rotate-45"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-emerald-600 rotate-45"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-charcoal mb-6 leading-tight">
              Where Muslim Investors
              <br />
              <span className="text-emerald-600">Meet Visionary</span>{" "}
              <span className="text-gold">Founders</span>
            </h1>
            <p className="text-xl md:text-2xl text-charcoal/70 mb-10 leading-relaxed">
              Halal-first founder-investor matching for the global Muslim ummah.
              <br />
              Built on trust, transparency, and barakah-driven partnerships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button href="/dashboard" variant="primary">
                For Investors
              </Button>
              <Button href="/dashboard" variant="secondary">
                For Visionaries
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
              How It Works
            </h2>
            <p className="text-xl text-charcoal/70 max-w-2xl mx-auto">
              Three simple steps to find your perfect halal investment or
              funding match
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Swipe"
              description="Browse through curated profiles of investors and founders. Swipe right on opportunities that align with your values and vision."
              icon="👆"
            />
            <StepCard
              number={2}
              title="Match"
              description="When both parties express interest, it's a match! Connect with like-minded Muslims who share your commitment to halal business."
              icon="💚"
            />
            <StepCard
              number={3}
              title="Build"
              description="Start meaningful conversations, build partnerships, and create barakah-driven ventures that benefit the ummah."
              icon="🚀"
            />
          </div>
        </div>
      </section>

      {/* Built for the Ummah Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-emerald-100 relative overflow-hidden">
        {/* Decorative Islamic geometric pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-40 h-40">
            <div className="w-full h-full border-4 border-emerald-600 rotate-45"></div>
            <div className="absolute inset-4 border-4 border-gold rotate-45"></div>
          </div>
          <div className="absolute bottom-10 left-20 w-32 h-32">
            <div className="w-full h-full border-4 border-gold rotate-45"></div>
            <div className="absolute inset-4 border-4 border-emerald-600 rotate-45"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
              Built for the Ummah
            </h2>
            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto">
              We&apos;re committed to creating a platform that aligns with Islamic
              principles and values, ensuring every connection is halal and
              barakah-driven.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ValueCard
              title="Halal Investing"
              description="All investments and partnerships are vetted to ensure compliance with Islamic finance principles."
              icon="🕌"
            />
            <ValueCard
              title="Trust & Transparency"
              description="Open communication and verified profiles create a foundation of trust for meaningful partnerships."
              icon="🤝"
            />
            <ValueCard
              title="Barakah-Driven"
              description="Every match is an opportunity to create positive impact and earn barakah through ethical business."
              icon="✨"
            />
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-charcoal/70 max-w-2xl mx-auto">
              Experience the Ummati platform on mobile and web
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ScreenshotPlaceholder
              title="Swipe Interface"
              description="Intuitive card-based matching experience"
            />
            <ScreenshotPlaceholder
              title="Match Dashboard"
              description="Manage your connections and conversations"
            />
            <ScreenshotPlaceholder
              title="Profile Builder"
              description="Create a compelling profile that stands out"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join thousands of Muslims building halal businesses and ethical
            investments
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/dashboard" variant="secondary">
              Get Started
            </Button>
            <Button href="/dashboard" variant="outline" className="bg-white">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
