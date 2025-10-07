"use client";

import Link from "next/link";
import PageHeader from "@/components/page-header";
import { Phone, Mail, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-50 to-amber-100">
            <PageHeader />
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4 max-w-4xl">

                    <div className="rounded-3xl border border-amber-200/70 bg-white/90 p-6 md:p-10 shadow-xl shadow-amber-100/60 ring-1 ring-amber-100/70 backdrop-blur">

                        {/* About + Logo with wrap-under effect */}
                        <div className="mx-auto max-w-4xl rounded-3xl border border-amber-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-sm">

                            {/* The logo floats right on md+ so text wraps beside and then under it */}
                            <div className="md:float-right md:ml-8 md:mb-2 mb-6 flex justify-center">
                                <div className="p-[2px] rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
                                    <div className="rounded-2xl bg-white p-1.5">
                                        <Image
                                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-El00MWAD0t6L2R4BsKFk0mJ4Uo8UQ5.png"
                                            alt="Real Good Japan Tour Logo"
                                            width={96}
                                            height={96}
                                            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl object-contain"
                                            priority
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Text flows around the floated logo */}
                            <div className="prose prose-lg max-w-none text-slate-700 space-y-3">
                                <h2 className="!mt-0 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
                                    About Real Good Japan Tour
                                </h2>

                                <p>
                                    We create moments that inspire a deep love for Japan. Our tours go beyond ordinary
                                    sightseeing — offering authentic cultural experiences that leave a lasting impression.
                                    Through meaningful encounters with Japanese traditions, we help travelers discover the
                                    true heart of Japan and create memories to treasure for a lifetime.
                                </p>
                                <p>
                                    Unlike many other tour companies, we do not rely on third-party booking apps like
                                    Viator, TripAdvisor, or GetYourGuide. All reservations are made directly through our
                                    website, ensuring no commission fees. This allows us to offer tours at prices about
                                    20% lower than those typically found on booking platforms while maintaining the highest
                                    standards of quality and authenticity.
                                </p>
                            </div>

                            {/* Clear the float so the badges sit below everything cleanly */}
                            <div className="clear-both mt-4 flex flex-wrap gap-3 text-sm">
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    Fully Licensed &amp; Insured
                                </span>
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    5-Star Rated Experience
                                </span>
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Luxury Guarantee
                                </span>
                            </div>
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
                                            href="https://www.instagram.com/realgoodjapantour?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                                            target="_blank"
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
