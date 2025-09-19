"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Hash, User, Mail, MapPin, Clock } from "lucide-react";

function Stars({ value, onChange, size = 22 }) {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i + 1)}
                    className="p-0.5"
                    aria-label={`Set rating to ${i + 1}`}
                >
                    <Star
                        className={`${i < value ? "text-amber-500 fill-current" : "text-slate-300"}`}
                        style={{ width: size, height: size }}
                    />
                </button>
            ))}
        </div>
    );
}

function hasTripHappened(tour_date, tour_time) {
    if (!tour_date) return false;
    const now = new Date();
    if (tour_time) {
        const dt = new Date(`${tour_date}T${tour_time}`);
        if (!isNaN(dt.getTime())) return now >= dt;
    }
    const day = new Date(`${tour_date}T00:00:00`);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return day < todayMidnight;
}

export default function ReviewPage() {
    // Lookup fields
    const [ref, setRef] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Compose review (no title column in your table)
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");

    const [loading, setLoading] = useState(false);
    const [lookupError, setLookupError] = useState(null);
    const [composeError, setComposeError] = useState(null);
    const [done, setDone] = useState(false);

    // Booking returned from RPC
    const [booking, setBooking] = useState(null);

    const eligible = useMemo(() => {
        if (!booking) return false;
        return hasTripHappened(booking.tour_date, booking.tour_time);
    }, [booking]);

    const onLookup = async (e) => {
        e.preventDefault();
        setLookupError(null);
        setComposeError(null);
        setDone(false);
        setBooking(null);

        const refTrim = ref.trim();
        const nameTrim = name.trim();
        const emailTrim = email.trim();
        if (!refTrim || !nameTrim || !emailTrim) {
            setLookupError("Please fill Reference, Name, and Email.");
            return;
        }

        setLoading(true);
        try {
            // Use the secure RPC we created earlier
            const { data, error } = await supabase.rpc("find_booking_by_ref", {
                _ref: refTrim,
                _name: nameTrim,
                _email: emailTrim,
            });

            if (error) {
                setLookupError(error.message);
                return;
            }
            const row = Array.isArray(data) ? data[0] : data;
            if (!row) {
                setLookupError("No matching booking found. Please check your details.");
                return;
            }

            // Reject if a review already exists for this booking
            const { data: existing } = await supabase
                .from("reviews")
                .select("id")
                .eq("booking_id", row.id)
                .maybeSingle();

            if (existing) {
                setLookupError("A review for this booking already exists. Thank you!");
                return;
            }

            setBooking(row);
        } finally {
            setLoading(false);
        }
    };

    const onSubmitReview = async (e) => {
        e.preventDefault();
        setComposeError(null);
        if (!booking) {
            setComposeError("Lookup a booking first.");
            return;
        }
        if (!eligible) {
            setComposeError("Your tour date hasn’t passed yet. You can review after your trip.");
            return;
        }
        if (!text.trim()) {
            setComposeError("Please write your review.");
            return;
        }
        if (!(rating >= 1 && rating <= 5)) {
            setComposeError("Rating must be between 1 and 5.");
            return;
        }

        setLoading(true);
        try {
            // Insert to your reviews table (NO email, NO title)
            const { error } = await supabase.from("reviews").insert([{
                booking_id: booking.id,
                tour_id: booking.tour_id,
                customer_name: booking.customer_name,
                rating,
                review_text: text.trim(),
                trip_date: booking.tour_date,
                // created_at defaults to now()
            }]);

            if (error) {
                setComposeError(error.message);
                return;
            }
            setDone(true);
        } finally {
            setLoading(false);
        }
    };

    const dateFmt = (iso) => (iso ? new Date(iso).toLocaleDateString() : "-");
    const timeFmt = (t) => (t ? t.slice(0, 5) : "-");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
            <PageHeader />

            <div className="container mx-auto px-4 py-10 max-w-4xl">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-slate-900">Find Your Trip to Write a Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onLookup} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="ref">Reference Number</Label>
                                <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1" required />
                            </div>
                            <div>
                                <Label htmlFor="name">Booking Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
                            </div>

                            <div className="md:col-span-3 flex items-center gap-3 pt-2">
                                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                                    {loading ? "Checking…" : "Continue"}
                                </Button>
                                {lookupError && <span className="text-red-600 text-sm">{lookupError}</span>}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {booking && (
                    <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl text-slate-900">Booking Found</CardTitle>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                    {eligible ? "Eligible to review" : "Not eligible yet"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-slate-800">
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div className="inline-flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium">Ref:</span> {booking.booking_number || booking.id}
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <User className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium">Name:</span> {booking.customer_name}
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium">Email:</span> {booking.customer_email}
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium">Tour:</span> {booking.tour_title || booking.tour_id}
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                    <span className="font-medium">Date / Time:</span> {dateFmt(booking.tour_date)} · {timeFmt(booking.tour_time)}
                                </div>
                            </div>

                            {!eligible && (
                                <div className="text-sm text-slate-600 mt-2">
                                    Your tour hasn’t happened yet. You can submit a review after your trip.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {booking && eligible && !done && (
                    <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl text-slate-900">Write Your Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={onSubmitReview} className="space-y-4">
                                <div>
                                    <Label>Rating</Label>
                                    <div className="mt-1">
                                        <Stars value={rating} onChange={setRating} />
                                    </div>
                                </div>

                                <div>
                                    <Label>Your review</Label>
                                    <Textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Tell us about your experience..."
                                        rows={5}
                                        className="mt-1"
                                        required
                                    />
                                </div>

                                {composeError && <div className="text-red-600 text-sm">{composeError}</div>}

                                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                                    {loading ? "Submitting…" : "Submit Review"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {done && (
                    <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl text-slate-900">Thank you!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700">
                                Your review has been submitted. It will appear on the tour page shortly.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
