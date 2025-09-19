"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Hash, Mail, MapPin, Users } from "lucide-react";
import PageHeader from "@/components/page-header";

type BookingResult = {
    id: string;
    booking_number: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    tour_id: string | null;
    tour_title: string | null;
    tour_date: string | null;   // ISO
    tour_time: string | null;   // "HH:MM:SS"
    guests: number | null;
    total_price: number | null;
    pickup_location: string | null;
    special_requests: string | null;
    status: string | null;
    payment_status: string | null;
    created_at: string | null;
};

export default function SearchBookingPage() {
    const [ref, setRef] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BookingResult | null>(null);
    const [searched, setSearched] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setSearched(false);

        const refTrim = ref.trim();
        const nameTrim = name.trim();
        const emailTrim = email.trim();

        if (!refTrim || !nameTrim || !emailTrim) {
            setError("Please fill all fields (Reference, Name, Email).");
            return;
        }

        setLoading(true);
        try {
            // Call the secure RPC
            const { data, error } = await supabase.rpc("find_booking_by_ref", {
                _ref: refTrim,
                _name: nameTrim,
                _email: emailTrim,
            });

            if (error) {
                setError(error.message);
            } else if (!data || (Array.isArray(data) && data.length === 0)) {
                setError("No matching booking found. Double-check your details.");
            } else {
                const row = Array.isArray(data) ? data[0] : data;
                setResult(row as BookingResult);
            }
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const currency = (n?: number | null) =>
        typeof n === "number"
            ? new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(n)
            : "-";

    const dateFmt = (iso?: string | null) =>
        iso ? new Date(iso).toLocaleDateString() : "-";

    const timeFmt = (t?: string | null) =>
        t ? t.slice(0, 5) : "-";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
            <PageHeader />

            <div className="container mx-auto px-4 py-10 max-w-4xl">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-slate-900">Find Your Booking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="ref">Reference Number</Label>
                                <Input
                                    id="ref"
                                    value={ref}
                                    onChange={(e) => setRef(e.target.value)}
                                    placeholder="e.g. RGJ-ABC123 or UUID"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Booking Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full name"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div className="md:col-span-3 flex items-center gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                                >
                                    {loading ? "Searching…" : "Search"}
                                </Button>
                                {error && <span className="text-red-600 text-sm">{error}</span>}
                                {searched && !error && !result && (
                                    <span className="text-slate-600 text-sm">No results found.</span>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Result */}
                {result && (
                    <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl text-slate-900">Booking Details</CardTitle>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                    {result.status || "pending"} · {result.payment_status || "pending"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Hash className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Reference:</span>
                                        <span>{result.booking_number || result.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <User className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Name:</span>
                                        <span>{result.customer_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Mail className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Email:</span>
                                        <span>{result.customer_email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Users className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Guests:</span>
                                        <span>{result.guests ?? "-"}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <MapPin className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Tour:</span>
                                        <span>{result.tour_title || result.tour_id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Date / Time:</span>
                                        <span>{dateFmt(result.tour_date)} · {timeFmt(result.tour_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <MapPin className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Pickup:</span>
                                        <span>{result.pickup_location || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                        <span className="font-medium">Total:</span>
                                        <span>{currency(result.total_price)}</span>
                                    </div>
                                </div>
                            </div>

                            {result.special_requests && (
                                <div className="mt-4">
                                    <div className="text-slate-800 font-medium mb-1">Special Requests</div>
                                    <div className="text-slate-700">{result.special_requests}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
