// app/gallery/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import PageHeader from "@/components/page-header";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    Camera,
    MapPin,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type DBGalleryRow = {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    category: string | null;
    image_url: string | null;   // optional single cover in DB
    created_at: string;
};

const BUCKET = "Gallery";

function formatNiceDate(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime())
        ? ""
        : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function GalleryDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [row, setRow] = useState<DBGalleryRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [urls, setUrls] = useState<string[]>([]);
    const [current, setCurrent] = useState(0);
    const viewerRef = useRef<HTMLDivElement | null>(null);

    // 1) fetch the gallery DB row
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("gallery")
                .select("id,title,description,location,category,image_url,created_at")
                .eq("is_approved", true)
                .eq("id", id)
                .maybeSingle();

            if (!alive) return;

            if (error || !data) {
                setRow(null);
                setLoading(false);
                return;
            }
            setRow(data as DBGalleryRow);
            setLoading(false);
        })();
        return () => { alive = false; };
    }, [id]);

    // 2) list images in Storage: Gallery/<id>/*
    useEffect(() => {
        if (!id) return;
        let alive = true;

        (async () => {
            const folder = String(id).trim();
            const { data, error } = await supabase
                .storage
                .from(BUCKET)
                .list(folder, { limit: 200, sortBy: { column: "name", order: "asc" } });

            if (!alive) return;

            if (error || !data?.length) {
                setUrls([]); // we’ll fallback to row.image_url below
                setCurrent(0);
                return;
            }

            const imgs = data
                .filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
                .map(f =>
                    supabase.storage.from(BUCKET)
                        .getPublicUrl(`${folder}/${encodeURIComponent(f.name)}`).data.publicUrl
                );

            setUrls(imgs);
            setCurrent(0);
        })();

        return () => { alive = false; };
    }, [id]);

    // 3) final images list with fallbacks
    const images = useMemo(() => {
        if (urls.length) return urls;
        if (row?.image_url) return [row.image_url];
        return ["/placeholder.svg"];
    }, [urls, row?.image_url]);

    const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
    const next = () => setCurrent(i => (i + 1) % images.length);
    const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-600">
                Loading gallery…
            </div>
        );
    }

    if (!row) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center px-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Gallery Not Found</h1>
                    <Button asChild>
                        <Link href="/gallery">Back to Gallery</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
            <PageHeader />

            {/* Hero / Title */}
            <section className="py-8 md:py-10 bg-gradient-to-br from-amber-600/10 via-orange-500/5 to-red-500/10">
                <div className="container mx-auto px-4">
                    <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200 px-3 py-1 text-xs font-semibold inline-flex">
                        <Camera className="w-4 h-4 mr-1" /> GALLERY STORY
                    </Badge>
                    <h1 className="mt-3 text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
                        {row.title}
                    </h1>
                </div>
            </section>

            {/* Two-column layout */}
            <section className="py-8">
                <div className="container mx-auto px-4 max-w-6xl grid gap-8 lg:grid-cols-2">
                    {/* LEFT: sticky viewer with pagination + thumbnails */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-0">
                                <div
                                    ref={viewerRef}
                                    tabIndex={0}
                                    onKeyDown={onKey}
                                    aria-label="Gallery viewer"
                                    className="relative group"
                                >
                                    <Image
                                        src={images[current]}
                                        alt={`${row.title} — image ${current + 1} of ${images.length}`}
                                        width={1400}
                                        height={900}
                                        sizes="(max-width: 1024px) 100vw, 48vw"
                                        className="w-full aspect-[4/3] object-cover"
                                        priority={current === 0}
                                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/placeholder.svg")}
                                    />

                                    {images.length > 1 && (
                                        <>
                                            <div className="absolute right-3 top-3 rounded-md bg-black/50 text-white text-xs px-2 py-1">
                                                {current + 1} / {images.length}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={prev}
                                                aria-label="Previous image"
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <ChevronLeft className="h-5 w-5 text-slate-800" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={next}
                                                aria-label="Next image"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <ChevronRight className="h-5 w-5 text-slate-800" />
                                            </button>

                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 rounded-full bg-black/25 px-2 py-1">
                                                {images.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrent(i)}
                                                        className={`h-2.5 w-2.5 rounded-full ${i === current ? "bg-white" : "bg-white/60 hover:bg-white/80"}`}
                                                        aria-label={`Go to image ${i + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {images.length > 1 && (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 md:p-4">
                                        {images.map((src, i) => (
                                            <button
                                                key={src + i}
                                                onClick={() => {
                                                    setCurrent(i);
                                                    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                }}
                                                className={`relative h-20 rounded-md overflow-hidden border ${i === current ? "border-amber-500" : "border-slate-200 hover:border-amber-300"
                                                    }`}
                                            >
                                                <Image src={src} alt={`thumb ${i + 1}`} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: details */}
                    <div>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl text-slate-900">About this moment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                                    {row.location && (
                                        <span className="inline-flex items-center">
                                            <MapPin className="h-4 w-4 mr-1 text-amber-600" />
                                            {row.location}
                                        </span>
                                    )}
                                    {row.category && (
                                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                                            {row.category}
                                        </Badge>
                                    )}
                                    <span className="inline-flex items-center">
                                        <Calendar className="h-4 w-4 mr-1 text-amber-600" />
                                        {formatNiceDate(row.created_at)}
                                    </span>
                                </div>

                                {row.description ? (
                                    <p className="text-slate-700 leading-relaxed">{row.description}</p>
                                ) : (
                                    <p className="text-slate-600">More details coming soon.</p>
                                )}

                                <div className="pt-2">
                                    <Button asChild variant="outline" className="border-amber-200">
                                        <Link href="/gallery">← Back to Gallery</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
