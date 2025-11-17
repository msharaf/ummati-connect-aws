"use client";

import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Button } from "./ui/Button";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#barakah", label: "Barakah Score" },
  { href: "#matching", label: "Matching" }
];

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-emerald-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-semibold text-emerald-700">
          Ummati
        </Link>
        <nav className="hidden gap-8 text-sm font-medium text-charcoal md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-emerald-600">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-emerald-200"></div>
          ) : isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900"
              >
                Dashboard
              </Link>
              <SignOutButton>
                <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
                  Logout
                </button>
              </SignOutButton>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

