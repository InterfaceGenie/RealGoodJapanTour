"use client";

import Link from "next/link";
import PageHeader from "@/components/page-header";
import { Phone, Mail, ExternalLink } from "lucide-react";

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-50 to-amber-100">
            <PageHeader />
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="rounded-3xl border border-amber-200/70 bg-white/90 p-6 md:p-10 shadow-xl shadow-amber-100/60 ring-1 ring-amber-100/70 backdrop-blur">
                        {/* Text */}
                        <div className="prose prose-lg mx-auto max-w-3xl text-slate-700 leading-relaxed md:leading-loose">
                            <p>
                                We create moments that inspire a deep love for Japan. Our tours go beyond ordinary
                                sightseeing — offering authentic cultural experiences that leave a lasting impression.
                                Through meaningful encounters with Japanese traditions, we help travelers discover the
                                true heart of Japan and create memories to treasure for a lifetime.
                            </p>
                            <p> </p>
                            <p>
                                Unlike many other tour companies, we do not rely on third-party booking apps like
                                Viator, TripAdvisor, or GetYourGuide. All reservations are made directly through our
                                website, ensuring no commission fees. This allows us to offer tours at prices about
                                20% lower than those typically found on booking platforms while maintaining the highest
                                standards of quality and authenticity.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-amber-200 to-transparent" />

                        {/* Company Info */}
                        <div className="">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Company Info</h2>

                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left column */}
                                <div className="space-y-3">
                                    <div className="text-slate-900 font-semibold">Real Good Japan Tour</div>

                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Phone className="w-4 h-4 text-amber-700 shrink-0" />
                                        <a href="tel:+818014786114" className="hover:underline">
                                            +81 80 1478 6114
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Mail className="w-4 h-4 text-amber-700 shrink-0" />
                                        <a href="mailto:realgoodjapantour@gmail.com" className="hover:underline">
                                            realgoodjapantour@gmail.com
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href="#"
                                            className="inline-flex items-center rounded-full border border-amber-200 px-3 py-1.5 text-amber-800 hover:bg-amber-50 transition"
                                            aria-label="Facebook"
                                        >
                                            Facebook <ExternalLink className="w-4 h-4 ml-1" />
                                        </Link>
                                        <Link
                                            href="#"
                                            className="inline-flex items-center rounded-full border border-amber-200 px-3 py-1.5 text-amber-800 hover:bg-amber-50 transition"
                                            aria-label="Instagram"
                                        >
                                            Instagram <ExternalLink className="w-4 h-4 ml-1" />
                                        </Link>
                                    </div>

                                    <div className="pt-1 text-slate-800">
                                        <div className="font-medium">President &amp; Chief Executive Officer</div>
                                        <div>Nozomu Kamei</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
