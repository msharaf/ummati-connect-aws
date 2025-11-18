import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";
import "../lib/clerk-config"; // Import workaround for cache invalidation
import { ClerkErrorHandler } from "../components/ClerkErrorHandler";
import { TRPCProvider } from "../src/lib/trpc";

export const metadata: Metadata = {
  metadataBase: new URL("https://ummati.app"),
  title: {
    default: "Ummati - Where Barakah Meets Opportunity",
    template: "%s | Ummati"
  },
  description:
    "Halal-first founder-investor matching for the global Muslim ummah.",
  openGraph: {
    title: "Ummati",
    description:
      "Discover visionary Muslim founders and ethical investors aligned with your values.",
    type: "website",
    locale: "en_US"
  },
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">
        <ClerkErrorHandler>
          <ClerkProvider
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/onboarding/choose-role"
            signOutRedirectUrl="/"
          >
            <TRPCProvider>{children}</TRPCProvider>
          </ClerkProvider>
        </ClerkErrorHandler>
      </body>
    </html>
  );
}

