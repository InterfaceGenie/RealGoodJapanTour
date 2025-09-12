"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, MapPin, Compass, Search } from "lucide-react";

type TourRow = {
    id: string;
    title: string;
    short_title: string | null;
    price: number | null;
    duration: string | null;
    max_guests: number | null;
    rating: number | null;
    reviews: number | null;
    image: string | null;          // singular in DB
    description: string | null;
    pickup_restrictions: string | null;
};

export default function ToursPage() {
    const [tours, setTours] = useState<TourRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true); setError(null);
            const cols = `
        id, title, short_title, price, duration, max_guests,
        rating, reviews, image, description, pickup_restrictions
      `;
            const { data, error } = await supabase.from("tours").select(cols).order("title", { ascending: true });
            if (!mounted) return;
            if (error) setError(error.message); else setTours(data || []);
            setLoading(false);
        })();
        return () => { mounted = false; };
    }, []);

    const filtered = tours.filter(t => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            t.title?.toLowerCase().includes(q) ||
            t.short_title?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
            <PageHeader />

            {/* Hero */}
            <section className="py-16 bg-gradient-to-br from-amber-600/10 via-orange-500/5 to-red-500/10">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold mb-6">
                        <Compass className="w-4 h-4 mr-2" />
                        CURATED EXPERIENCES
                    </Badge>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-br from-slate-900 via-amber-800 to-orange-700 bg-clip-text text-transparent leading-tight">
                        Premium Tours
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Choose from our hand-picked experiences. Click a card to see details & book.
                    </p>

                    {/* Search */}
                    <div className="mt-8 mx-auto max-w-xl relative">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search tours…"
                            className="w-full rounded-xl border border-amber-200 bg-white/90 backdrop-blur-sm px-12 py-3 text-slate-800 shadow focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    {loading && <div className="text-center text-slate-600 py-12">Loading…</div>}
                    {error && <div className="text-center text-red-600 py-12">{error}</div>}

                    {!loading && !error && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {filtered.map((t) => {
                                const slug = t.id;
                                return (
                                    <Link key={t.id} href={`/tours/${slug}`} className="group">
                                        <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 bg-white">
                                            <div className="relative h-64 w-full">
                                                <Image
                                                    src={t.image || "/placeholder.svg"}
                                                    alt={t.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <Badge className="absolute top-4 right-4 bg-white/90 text-slate-800 border-0">
                                                    {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(t.price ?? 0)}
                                                </Badge>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>

                                            <div className="p-6">
                                                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{t.title}</h3>
                                                {t.short_title && (
                                                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{t.short_title}</p>
                                                )}

                                                <div className="flex items-center justify-between text-sm text-slate-600">
                                                    <span className="inline-flex items-center">
                                                        <Star className="h-4 w-4 text-amber-500 fill-current mr-1" />
                                                        {t.rating ?? 0} · {t.reviews ?? 0} reviews
                                                    </span>
                                                    <span className="inline-flex items-center">
                                                        <Clock className="h-4 w-4 text-amber-600 mr-1" />
                                                        {t.duration || "Flexible"}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                                    <span className="inline-flex items-center">
                                                        <Users className="h-3.5 w-3.5 mr-1" />
                                                        up to {t.max_guests ?? 1}
                                                    </span>
                                                    <span className="inline-flex items-center">
                                                        <MapPin className="h-3.5 w-3.5 mr-1" />
                                                        Japan
                                                    </span>
                                                </div>

                                                <Button className="w-full mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                                                    View & Book
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                            {!filtered.length && (
                                <div className="col-span-full text-center text-slate-600 py-12">
                                    No tours match your search.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
