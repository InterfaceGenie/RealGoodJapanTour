"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import PageHeader from "@/components/page-header"
import { supabase } from "@/lib/supabase"

type GalleryItem = {
  id: string
  title: string
  description: string | null
  location: string | null
  category: string | null
  image_url: string | null
  created_at: string
  google_url?: string | null
}

async function getFirstImageUrlForId(id: string): Promise<string | null> {
  // List files in bucket folder: Gallery/<id>/
  const listRes = await supabase.storage.from("Gallery").list(id, {
    limit: 1,
    sortBy: { column: "name", order: "asc" },
  })
  if (listRes.error || !listRes.data?.length) return null

  const fileName = listRes.data[0].name
  const path = `${id}/${fileName}`

  // Try as public first
  const pub = supabase.storage.from("Gallery").getPublicUrl(path)
  if (pub?.data?.publicUrl) return pub.data.publicUrl

  // If bucket is private, sign a URL
  const signed = await supabase.storage.from("Gallery").createSignedUrl(path, 60 * 60) // 1 hour
  if (signed.error) return null
  return signed.data.signedUrl
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<string[]>(["All"])
  const [catLoading, setCatLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

  // Fetch gallery rows
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true); setError(null)
      const { data, error } = await supabase
        .from("gallery")
        .select("id,title,description,location,category,image_url,created_at,google_url")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })

      if (!mounted) return
      if (error) setError(error.message)
      else setItems(data || [])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  // Fetch distinct categories (approved)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setCatLoading(true)
      const { data, error } = await supabase
        .from("gallery")
        .select("category")
        .eq("is_approved", true)
        .order("category", { ascending: true })

      if (!mounted) return
      if (error) {
        // fallback from already-fetched items
        const derived = Array.from(
          new Set(items.map(i => (i.category || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))
        setCategories(["All", ...derived])
      } else {
        const uniq = Array.from(
          new Set((data || []).map(r => (r.category ?? "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))
        setCategories(["All", ...uniq])
      }
      setCatLoading(false)
    })()
    return () => { mounted = false }
    // If you want to re-evaluate when items change, add `items` to deps
  }, [])

  // For items missing image_url in DB, fetch first file in Storage/Gallery/<id>/
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const targets = items.filter(it => !it.image_url && !imageUrls[it.id])
      if (!targets.length) return

      const results = await Promise.all(
        targets.map(async it => ({ id: it.id, url: await getFirstImageUrlForId(it.id) }))
      )
      if (cancelled) return

      setImageUrls(prev => {
        const next = { ...prev }
        for (const r of results) {
          if (r.url) next[r.id] = r.url
        }
        return next
      })
    })()
    return () => { cancelled = true }
  }, [items])

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items
    const norm = activeCategory.toLowerCase()
    return items.filter(i => (i.category || "").toLowerCase() === norm)
  }, [items, activeCategory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageHeader />

      <section className="py-16 bg-gradient-to-br from-amber-600/10 via-orange-500/5 to-red-500/10">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold mb-6">
            <Camera className="w-4 h-4 mr-2" />
            AUTHENTIC EXPERIENCES GALLERY
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-br from-slate-900 via-amber-800 to-orange-700 bg-clip-text text-transparent leading-tight">
            Experience Gallery
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Witness the authentic moments and genuine joy of our distinguished guests.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {catLoading ? (
              <div className="text-slate-500 text-sm py-2">Loading categories…</div>
            ) : (
              categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  className={
                    activeCategory === category
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                      : "border-amber-200 text-amber-700 hover:bg-amber-50"
                  }
                >
                  {category}
                </Button>
              ))
            )}
          </div>

          {/* Data states */}
          {loading && <div className="text-center text-slate-600 py-12">Loading…</div>}
          {error && <div className="text-center text-red-600 py-12">{error}</div>}

          {/* Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filtered.map((item) => {
                const displayUrl = item.image_url || imageUrls[item.id] || "/placeholder.svg"
                return (
                  <div key={item.id} className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 bg-white">
                    <Link href={`/gallery/${item.id}`} className="group block">
                      <div className="relative">
                        <Image
                          src={displayUrl}
                          alt={item.title}
                          width={500}
                          height={400}
                          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Badge className="absolute top-4 right-4 bg-white/90 text-slate-800 border-0">
                          {item.category || "Gallery"}
                        </Badge>
                        <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                          {item.description && <p className="text-amber-200 text-sm mb-2">{item.description}</p>}
                          {item.location && (
                            <div className="flex items-center text-xs text-amber-100">
                              <MapPin className="h-3 w-3 mr-1" />
                              {item.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                        {item.description && <p className="text-slate-600 text-sm mb-3">{item.description}</p>}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-slate-500">
                            {item.location && (
                              <>
                                <MapPin className="h-3 w-3 mr-1" />
                                {item.location}
                              </>
                            )}
                          </div>
                          <Badge variant="outline" className="border-amber-200 text-amber-700 text-xs">
                            {item.category || "Gallery"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-2">100+</div>
              <div className="text-slate-600">Happy Guests</div>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-2">50+</div>
              <div className="text-slate-600">Sacred Sites Visited</div>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-2">15+</div>
              <div className="text-slate-600">Countries Represented</div>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-2">5★</div>
              <div className="text-slate-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

