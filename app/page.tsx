"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Star, Camera, Award, Shield, Heart, MessageCircle } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import { supabase } from "@/lib/supabase/browser"

/** DB types (match your schema) */
type TourRow = {
  id: string
  title: string
  short_title: string | null
  description: string | null
  price: number
  duration: string | null
  max_guests: number | null
  rating: number | null
  reviews: number | null
  image: string | null
  is_active: boolean | null
}

type GalleryRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  category: string | null
  image_url: string
  created_at: string
  is_approved: boolean | null
}

/** Static testimonials unchanged */
const testimonials = [
  { id: 1, name: "Diego O.", date: "July 2025", title: "Best tour in Kyoto", rating: 5, review: "It was a magical tour...", experience: "Kyoto Cultural Experience" },
  { id: 2, name: "Cristina M.", date: "July 2025", title: "Christine, the best guide...", rating: 5, review: "Christine was excellent...", experience: "Osaka to Kyoto Tour" },
  { id: 3, name: "Aida H.", date: "June 2025", title: "Piners visiting Kyoto", rating: 5, review: "Full day in Kyoto with the best guide...", experience: "Kyoto Full Day Experience" },
  { id: 4, name: "Rosalinda M.", date: "June 2025", title: "My first visit in Japan is awesome", rating: 5, review: "My sister and I first visit to Japan was awesome...", experience: "First Japan Experience" }
]

export default function HomePage() {
  const [tours, setTours] = useState<TourRow[]>([])
  const [gallery, setGallery] = useState<GalleryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
      ; (async () => {
        setLoading(true); setError(null)

        const tourCols = "id,title,short_title,description,price,duration,max_guests,rating,reviews,image,is_active";
        const galCols = "id,title,description,location,category,image_url,created_at,is_approved";
        const [{ data: tourData, error: tourErr }, { data: galData, error: galErr }] = await Promise.all([
          supabase.from("tours").select(tourCols).eq("is_active", true).order("rating", { ascending: false }).limit(4),
          supabase.from("gallery").select(galCols).eq("is_approved", true).order("created_at", { ascending: false }).limit(6),
        ])

        if (!active) return
        if (tourErr || galErr) {
          setError(tourErr?.message || galErr?.message || "Failed to load data")
        } else {
          setTours(tourData ?? [])
          setGallery(galData ?? [])
        }
        setLoading(false)
      })()
    return () => { active = false }
  }, [])

  const featuredTours = useMemo(() => {
    return (tours || []).map((t) => {
      const image = t.image || "/placeholder.svg";
      const priceLabel = new Intl.NumberFormat("ja-JP", {
        style: "currency", currency: "JPY", minimumFractionDigits: 0
      }).format(Number(t.price || 0));
      return {
        id: t.id,
        title: t.title,
        location: "Japan",
        duration: t.duration ?? "",
        price: priceLabel,
        rating: Number(t.rating ?? 0),
        reviews: Number(t.reviews ?? 0),
        image,
        description: t.description ?? "",
        maxGuests: Number(t.max_guests ?? 15),
        badge: "POPULAR" as const,
        nextAvailable: "Daily",
      };
    });
  }, [tours]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageHeader />

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-500/5 to-red-500/10" />
        <div className="absolute inset-0 bg-[url('/luxury-pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold">
                <Award className="w-4 h-4 mr-2" />
                Japan's Premier Luxury Tour Experience
              </Badge>
            </div>
            <h2 className="text-5xl lg:text-7xl font-bold mb-8 bg-gradient-to-br from-slate-900 via-amber-800 to-orange-700 bg-clip-text text-transparent leading-tight">
              Discover Japan's
              <span className="block">Hidden Treasures</span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Embark on an extraordinary journey through Osaka and Kobe with our exclusive,
              <span className="text-amber-700 font-semibold"> handcrafted luxury experiences</span>.
              Where authentic culture meets unparalleled sophistication.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl hover:shadow-2xl transition-all duration-300" asChild>
                <Link href="#tours">
                  <Calendar className="mr-3 h-6 w-6" />
                  View Exclusive Tours
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 border-amber-200 text-amber-700 hover:bg-amber-50 shadow-lg" asChild>
                <Link href="/gallery">
                  <Camera className="mr-3 h-6 w-6" />
                  Experience Gallery
                </Link>
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-amber-600" />
                Fully Licensed & Insured
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-amber-600 fill-amber-600" />
                5-Star Rated Experience
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-amber-600" />
                Luxury Guarantee
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard label="Happy Travelers" value="200+" icon={<Users className="h-8 w-8 text-white" />} />
            <StatCard label="Average Rating" value="4.9/5" icon={<Star className="h-8 w-8 text-white" />} />
            <StatCard label="Unique Experiences" value="60+" icon={<Camera className="h-8 w-8 text-white" />} />
            <StatCard label="Satisfaction Rate" value="97%" icon={<Heart className="h-8 w-8 text-white" />} />
          </div>
        </div>
      </section>

      {/* Featured Tours (from DB) */}
      <section id="tours" className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-4">CURATED EXPERIENCES</Badge>
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
              Signature Tours & Experiences
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From authentic food adventures to customized cultural journeys, each tour is crafted to spark a deep love for Japan.
            </p>
          </div>

          {loading && <div className="text-center text-slate-600 py-8">Loading tours…</div>}
          {error && <div className="text-center text-red-600 py-8">{error}</div>}

          {!loading && !error && (
            <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {featuredTours.map((tour) => (
                <Card key={tour.id} className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm group hover:-translate-y-2">
                  <div className="relative">
                    <Image
                      src={tour.image || "/placeholder.svg"}
                      alt={tour.title}
                      width={600}
                      height={300}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute top-4 left-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 shadow-lg">
                      {tour.badge}
                    </Badge>
                    <div className="absolute top-4 right-4 bg-white/95 text-slate-900 px-3 py-2 rounded-lg font-bold shadow-lg">
                      <span className="text-lg">{tour.price}</span>
                      <div className="text-xs text-slate-600">per person</div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <Badge variant="outline" className="border-white/50 text-white bg-black/30 backdrop-blur-sm">
                        {tour.location}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl leading-tight text-slate-900 group-hover:text-amber-700 transition-colors">
                        {tour.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-slate-600 leading-relaxed">
                      {tour.description}
                    </CardDescription>
                    <div className="text-sm text-amber-700 font-medium italic">
                      Recommended by happy travelers
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600">
                        <Clock className="h-4 w-4 mr-2 text-amber-600" />
                        {tour.duration}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Users className="h-4 w-4 mr-2 text-amber-600" />
                        Max {tour.maxGuests} guests
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="font-semibold text-slate-900">{tour.rating.toFixed(1)}</span>
                        <span className="text-sm text-slate-500">({tour.reviews} reviews)</span>
                      </div>
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                        {tour.nextAvailable}
                      </Badge>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                      <Link href={`/tour/${tour.id}`}>
                        Reserve This Experience
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mini Gallery (latest from DB) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-4">AUTHENTIC MOMENTS</Badge>
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
              Real Experiences, Real Memories
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              A peek at the latest memories from our guests.
            </p>
          </div>

          {loading && <div className="text-center text-slate-600 py-8">Loading gallery…</div>}

          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {gallery.map((g) => (
                  <div key={g.id} className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
                    <Image
                      src={g.image_url || "/placeholder.svg"}
                      alt={g.title}
                      width={400}
                      height={500}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <h4 className="text-xl font-bold mb-1">{g.title}</h4>
                      {g.description && <p className="text-amber-200 text-sm line-clamp-2">{g.description}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        {g.category && (
                          <Badge className="bg-white/90 text-slate-800 border-0">{g.category}</Badge>
                        )}
                        {g.location && (
                          <span className="text-xs text-amber-200 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" /> {g.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300" asChild>
                  <Link href="/gallery">
                    <Camera className="mr-3 h-5 w-5" />
                    View Complete Gallery
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Testimonials (unchanged) */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-white text-amber-800 border-amber-200 mb-4 shadow-sm">GUEST TESTIMONIALS</Badge>
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
              What Our Guests Say
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Real reviews from real guests who experienced the magic of Japan with us
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{t.name}</h4>
                      <p className="text-sm text-slate-500">{t.date}</p>
                    </div>
                    <div className="flex">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-lg text-amber-700">{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-slate-600 leading-relaxed mb-4 italic text-sm">"{t.review}"</blockquote>
                  <Badge variant="outline" className="border-amber-200 text-amber-700 text-xs">{t.experience}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Footer (your existing content) */}
      <Cta />
      <Footer />
    </div>
  )
}

/** Small presentational helpers */
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
      <div className="text-slate-600 font-medium">{label}</div>
    </div>
  )
}

function Cta() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-amber-900 to-orange-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L3N2Zz4=')] opacity-20" />
      <div className="container mx-auto px-4 text-center relative">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            LIMITED AVAILABILITY
          </Badge>
          <h3 className="text-4xl lg:text-5xl font-bold mb-6">Your Japan Adventure Awaits</h3>
          <p className="text-xl lg:text-2xl mb-10 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Join the select few who experience Japan's most guarded treasures. Secure your spot today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button size="lg" className="text-lg px-10 py-7 bg-white text-slate-900 hover:bg-amber-50 shadow-xl hover:shadow-2xl transition-all duration-300" asChild>
              <Link href="/booking">
                <Calendar className="mr-3 h-5 w-5" />
                Reserve Your Experience
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 py-7 bg-white text-slate-900 hover:bg-amber-50 shadow-xl hover:shadow-2xl transition-all duration-300" asChild>
              <Link href="/contact">
                <MessageCircle className="mr-3 h-5 w-5" />
                Speak with Concierge
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto text-amber-200">
            <div className="text-center"><div className="text-sm font-medium">Exclusive experiences</div></div>
            <div className="text-center"><div className="text-sm font-medium">Limited to 4-15 guests</div></div>
            <div className="text-center"><div className="text-sm font-medium">Fully customizable</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4">
        {/* … keep your existing footer content … */}
        <div className="border-top mt-4 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Real Good Japan Tour. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
