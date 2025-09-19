"use client"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function PageHeader() {
  return (
    <header className="border-b border-amber-200/50 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <nav>
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-El00MWAD0t6L2R4BsKFk0mJ4Uo8UQ5.png"
                alt="Real Good Japan Tour Logo"
                width={80}
                height={80}
                className="w-20 h-20"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Real Good Japan Tour
                </h1>
                <p className="text-xs text-amber-600/80 font-medium tracking-wide">LUXURY EXPERIENCES</p>
              </div>
            </Link>
          </nav>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/tours" className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors">
              Tours
            </Link>
            <Link href="/gallery" className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors">
              Gallery
            </Link>
            <Link href="/search" className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors">
              Search
            </Link>
            <Link href="/review" className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors">
              Review
            </Link>
            <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors">
              Contact
            </Link>
            <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg" asChild>
              <Link href="/booking">
                Booking
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}