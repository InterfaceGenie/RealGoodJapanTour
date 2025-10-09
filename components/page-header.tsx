"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { href: "/tours", label: "Tours" },
  { href: "/gallery", label: "Gallery" },
  { href: "/search", label: "Search" },
  { href: "/review", label: "Review" },
  { href: "/contact", label: "Contact" },
  { href: "/aboutUs", label: "About Us" },
];

export default function PageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/50 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        {/* Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <nav className="min-w-0">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-El00MWAD0t6L2R4BsKFk0mJ4Uo8UQ5.png"
                alt="Real Good Japan Tour Logo"
                width={64}
                height={64}
                className="h-12 w-12 md:h-16 md:w-16 shrink-0"
                priority
              />
              <div className="truncate">
                <h1 className="truncate text-lg md:text-2xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Real Good Japan Tour
                </h1>
                <p className="text-[10px] md:text-xs text-amber-600/80 font-medium tracking-wide">
                  LUXURY EXPERIENCES
                </p>
              </div>
            </Link>
          </nav>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Button
              asChild
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
            >
              <Link href="/booking">Booking</Link>
            </Button>
          </nav>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Always-visible Booking CTA on mobile so it never gets hidden/blocked */}
            <Button
              asChild
              size="sm"
              className="h-9 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow"
            >
              <Link href="/booking" aria-label="Go to booking">Book</Link>
            </Button>

            {/* Hamburger menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[380px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4" />
                <div className="grid gap-2">
                  {NAV_LINKS.map((l, idx) => (
                    <div key={l.href}>
                      <Link
                        href={l.href}
                        className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                      >
                        {l.label}
                      </Link>
                      {idx < NAV_LINKS.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                  >
                    <Link href="/booking">Book your tour</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
