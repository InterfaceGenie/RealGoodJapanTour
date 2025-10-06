"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPicker } from "@/components/map-picker";
import { Star, Users, Clock, MapPin, CheckCircle, MessageCircle, Mail } from "lucide-react";
import { priceBreakdown, fmtJPY } from "@/lib/pricing";
import { ExternalLink } from "lucide-react";

type UITour = {
  id: string;
  dbId: string;      // real uuid (tours.id)
  title: string;
  shortTitle?: string;
  price: number;
  duration: string;
  maxGuests: number;
  rating: number;
  reviews: number;
  image: string | null;     // singular in DB
  highlights: string[];
  description: string;
  pickupRestrictions: string;
};

type PickerValue = { address: string; lat: number | null; lng: number | null };
const normPick = (v: any): PickerValue =>
  !v ? { address: "", lat: null, lng: null }
    : typeof v === "string" ? { address: v, lat: null, lng: null }
      : { address: v.address ?? v.label ?? "", lat: Number.isFinite(v.lat) ? Number(v.lat) : null, lng: Number.isFinite(v.lng) ? Number(v.lng) : null };

const toSqlTime = (t: string) => {
  if (!t) return "";
  const d = new Date(`1970-01-01T${t}`);
  if (!isNaN(d.getTime())) return d.toTimeString().slice(0, 8);
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "";
  let [_, h, mm, ap] = m; let hh = parseInt(h, 10);
  ap = ap.toUpperCase();
  if (ap === "PM" && hh !== 12) hh += 12;
  if (ap === "AM" && hh === 12) hh = 0;
  return `${String(hh).padStart(2, "0")}:${mm}:00`;
};

export default function BookingGridPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement | null>(null);

  // tours
  const [tours, setTours] = useState<UITour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTour = useMemo(() => tours.find(t => t.id === selectedId) || null, [tours, selectedId]);

  // form state (same as your tour page)
  const [guests, setGuests] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [pickup, setPickup] = useState<PickerValue>({ address: "", lat: null, lng: null });
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // for image loading
  const [covers, setCovers] = useState<Record<string, string>>({});
  const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" font-size="28" text-anchor="middle" fill="%23999" dy=".3em">No image</text></svg>';

  // --- Coupons ---
  type Coupon = { ref: string; title: string | null; discount: number };
  const [couponRef, setCouponRef] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // reset coupon when tour or guests change (optional)
  useEffect(() => {
    setCouponError(null);
  }, [selectedId, guests]);

  useEffect(() => {
    if (!tours.length) return;
    let cancelled = false;

    (async () => {
      // Build entries [tourId, url|null]
      const entries = await Promise.all(
        tours.map(async (t) => {
          const id = t.id?.trim();
          if (!id) return [t.id, null] as const;
          // 1) list files in Tours/<id>
          const { data, error } = await supabase
            .storage
            .from("Tours")
            .list(id, { limit: 200, sortBy: { column: "name", order: "asc" } });
          if (error || !data?.length) return [id, null] as const;

          // 2) choose first image-looking file
          const imageFile =
            data.find(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name)) || data[0];

          // 3) build public URL
          const path = `${id}/${encodeURIComponent(imageFile.name)}`;
          const url = supabase.storage.from("Tours").getPublicUrl(path).data.publicUrl;
          return [id, url] as const;
        })
      );

      if (!cancelled) {
        const map = Object.fromEntries(entries.filter(([_, u]) => !!u) as [string, string][]);
        setCovers(map);
      }
    })();

    return () => { cancelled = true; };
  }, [tours]);
  // fetch tours (only real columns)
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);

      const columns = `
        id, title, short_title, price, duration, max_guests,
        rating, reviews, image, highlights, description, pickup_restrictions
      `;
      const { data, error } = await supabase
        .from("tours")
        .select(columns)
        .order("title", { ascending: true });

      if (!active) return;

      if (error) {
        setError(error.message);
        setTours([]);
        setLoading(false);
        return;
      }

      const mapped: UITour[] = (data || []).map((t: any) => ({
        id: (t.id as string),
        dbId: t.id as string,
        title: t.title,
        shortTitle: t.short_title ?? undefined,
        price: Number(t.price ?? 0),
        duration: t.duration ?? "",
        maxGuests: Number(t.max_guests ?? 1),
        rating: Number(t.rating ?? 0),
        reviews: Number(t.reviews ?? 0),
        image: t.image ?? null,
        highlights: Array.isArray(t.highlights) ? t.highlights : [],
        description: t.description ?? "",
        pickupRestrictions: t.pickup_restrictions ?? "flexible",
      }));

      setTours(mapped);
      if (mapped.length && !selectedId) setSelectedId(mapped[0].id);
      setLoading(false);
    })();

    return () => { active = false; };
  }, [selectedId]);

  // Shared pricing calc (group tiers + solo multiplier + coupon)
  const breakdown = priceBreakdown({
    pricePerPerson: selectedTour?.price ?? 0,
    guests,
    soloMultiplier: 2,                    // same rule: 1 guest = x2
    couponPercent: coupon?.discount ?? 0, // from DB
  });

  const {
    baseTotal,
    groupDiscountPercent,
    groupDiscountAmount,
    subtotalAfterGroup,
    couponPercent,
    couponAmount,
    total,
    soloApplied,
  } = breakdown;

  const formattedBaseTotal = fmtJPY(baseTotal);
  const formattedGroupDiscount = groupDiscountAmount ? `− ${fmtJPY(groupDiscountAmount)}` : undefined;
  const formattedSubtotalAfterGp = fmtJPY(subtotalAfterGroup);
  const formattedCouponAmount = couponAmount ? `− ${fmtJPY(couponAmount)}` : undefined;
  const formattedTotal = fmtJPY(total);

  const onChooseTour = (id: string) => {
    setSelectedId(id);
    // scroll to form
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTour) { alert("Please select a tour from the grid."); return; }
    if (!agreedToTerms) { alert("Please agree to the terms and conditions."); return; }
    if (!selectedDate || !selectedTime || !pickup.address || !customerName || !customerEmail || !customerPhone) {
      alert("Please fill all required fields."); return;
    }
    const sqlTime = toSqlTime(selectedTime);
    if (!sqlTime) { alert("Invalid time format."); return; }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("book_tour_atomic_by_date", {
      _tour_id: selectedTour.dbId,          // uuid of tours.id
      _tour_date: selectedDate,             // 'YYYY-MM-DD'
      _tour_time: sqlTime,                  // 'HH:MM:SS'
      _guests: guests,
      _total_price: Math.max(0, Math.round(Number(total))),
      _pickup_location: pickup.address,
      _pickup_lat: pickup.lat,
      _pickup_lng: pickup.lng,
      _customer_name: customerName,
      _customer_email: customerEmail,
      _customer_phone: customerPhone,
      _special_requests: specialRequests || null,
      _status: "pending",
      _payment_status: "pending",
    });

    setSubmitting(false);

    if (error) {
      if ((error as any)?.message?.includes("book_tour_atomic")) {
        console.error("Did you run the SQL to create book_tour_atomic?");
      }
      console.error("Booking failed:", error);
      alert(`Booking failed: ${error.message}`);
      return;
    }
    const ref = (data as any)?.booking_number || (data as any)?.id;
    if (!ref) {
      alert("Booked, but no reference returned. Please check your database function return.");
      return;
    }
    router.push(`/confirmation?ref=${encodeURIComponent(ref)}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading tours…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-slate-600">{error}</div>;
  const handleApplyCoupon = async () => {
    if (!couponRef.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("ref,title,discount")
        .ilike("ref", couponRef.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data) { setCoupon(null); setCouponError("Coupon not found."); return; }

      const pct = Number(data.discount ?? 0);
      if (!Number.isFinite(pct) || pct <= 0) {
        setCoupon(null); setCouponError("This coupon has no discount."); return;
      }
      setCoupon({ ref: data.ref, title: data.title ?? null, discount: pct });
    } catch (e: any) {
      setCoupon(null);
      setCouponError(e?.message ?? "Failed to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponRef("");
    setCouponError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageHeader />

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Two-column layout: left list, right form */}
        <div className="grid gap-8 lg:grid-cols-[360px,1fr]">
          {/* LEFT: Scrollable tours list */}
          <aside>
            <div className="sticky top-24">
              {/* viewport-height list area; adjust 7rem if your header height differs */}
              <div className="h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Choose Your Tour</h2>

                {tours.map((t) => {
                  const active = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onChooseTour(t.id)}
                      className={[
                        "w-full text-left rounded-xl border transition mb-3",
                        active
                          ? "border-amber-400 bg-amber-50/60 shadow"
                          : "border-slate-200 bg-white hover:bg-amber-50/40"
                      ].join(" ")}
                    >
                      <div className="flex gap-3 p-3">
                        <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                          <Image
                            src={covers[t.id] || t.image || PLACEHOLDER}
                            alt={t.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900 line-clamp-1">{t.title}</p>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                              {new Intl.NumberFormat("ja-JP", {
                                style: "currency",
                                currency: "JPY",
                                minimumFractionDigits: 0
                              }).format(t.price)}
                            </Badge>
                          </div>

                          <div className="mt-1 flex items-center text-xs text-slate-600 gap-3">
                            <span className="inline-flex items-center">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-current mr-1" />
                              {t.rating} · {t.reviews}
                            </span>
                            <span className="inline-flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" />
                              {t.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {!tours.length && (
                  <div className="text-slate-600">No tours found.</div>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT: selected details + booking form */}
          <section className="space-y-8">
            {/* Selected tour summary (non-sticky) */}
            <div>
              {selectedTour ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-900">{selectedTour.title}</CardTitle>
                    <CardDescription className="text-slate-600">
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="inline-flex items-center">
                          <Clock className="h-5 w-5 text-amber-600 mr-2" /> {selectedTour.duration}
                        </span>
                        <span className="inline-flex items-center">
                          <Users className="h-5 w-5 text-amber-600 mr-2" /> 1–{selectedTour.maxGuests} guests
                        </span>
                        <span className="inline-flex items-center">
                          <MapPin className="h-5 w-5 text-amber-600 mr-2" /> Japan
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(covers[selectedTour.id] || selectedTour.image) && (
                      <div className="relative h-60 w-full rounded-lg overflow-hidden">
                        <Image
                          src={covers[selectedTour.id] || selectedTour.image!}
                          alt={selectedTour.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 700px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {!!selectedTour.highlights.length && (
                      <>
                        <h3 className="font-semibold text-slate-900">Highlights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedTour.highlights.map((h, i) => (
                            <div key={i} className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-slate-700">{h}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    Select a tour on the left to see details.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Booking form (sticky so it stays aligned with the list) */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur sticky top-24">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-[18px]">
                <CardTitle className="text-3xl font-extrabold tracking-tight">
                  Book This Tour
                </CardTitle>
                <CardDescription className="text-amber-100 text-base mt-1">
                  Secure your spot on this amazing experience
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleBooking} className="space-y-7">
                  {/* Number of Guests */}
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-slate-900">Number of Guests</Label>
                    <div className="flex items-center justify-between bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="h-10 w-10 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        –
                      </Button>

                      <div className="text-center select-none">
                        <div className="text-3xl font-extrabold text-slate-900 leading-none">{guests}</div>
                        <div className="text-base text-slate-600 mt-1">{guests === 1 ? "guest" : "guests"}</div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setGuests((g) => Math.min(selectedTour?.maxGuests ?? 1, g + 1))
                        }
                        className="h-10 w-10 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Total / breakdown panel */}
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/70 to-amber-50/40 p-5">
                    <div className="flex items-center justify-between text-slate-700 mb-2">
                      <span className="text-lg">
                        {fmtJPY(selectedTour?.price ?? 0)} × {guests} {guests === 1 ? "guest" : "guests"}
                        {soloApplied && " (solo rate applied)"}
                      </span>
                      <span className="font-semibold">{formattedBaseTotal}</span>
                    </div>

                    {groupDiscountPercent > 0 && (
                      <>
                        <div className="mt-2 flex justify-between items-center text-sm">
                          <div className="text-emerald-700">Group discount — {groupDiscountPercent}% off</div>
                          <div className="text-emerald-700">{formattedGroupDiscount}</div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-semibold text-slate-900">{formattedSubtotalAfterGp}</span>
                        </div>
                      </>
                    )}

                    {/* Coupon input */}
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponRef}
                        onChange={(e) => setCouponRef(e.target.value)}
                        className="border-amber-200"
                        disabled={!!coupon}
                      />
                      {coupon ? (
                        <Button type="button" variant="outline" onClick={handleRemoveCoupon} className="border-amber-200">
                          Remove
                        </Button>
                      ) : (
                        <Button type="button" onClick={handleApplyCoupon} disabled={couponLoading} className="bg-amber-600 hover:bg-amber-700">
                          {couponLoading ? "Applying…" : "Apply"}
                        </Button>
                      )}
                    </div>
                    {couponError && <div className="mt-2 text-sm text-red-600">{couponError}</div>}

                    {couponPercent > 0 && (
                      <div className="mt-3 flex justify-between items-center text-sm">
                        <div className="text-emerald-700">
                          {coupon?.title ? `${coupon.title} ` : "Coupon"} ({coupon?.ref || ""}) — {couponPercent}% off
                        </div>
                        <div className="text-emerald-700">{formattedCouponAmount}</div>
                      </div>
                    )}

                    <div className="h-px bg-amber-200 my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-slate-900">Total</span>
                      <span className="text-3xl font-extrabold text-amber-600">{formattedTotal}</span>
                    </div>
                  </div>


                  {/* Date / Time */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Preferred Date *</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="h-12 rounded-xl border-2 border-amber-200 focus-visible:ring-amber-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Preferred Time *</Label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        required
                        className="h-12 w-full rounded-xl border-2 border-amber-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select time</option>
                        <option value="8:00 AM">8:00 AM</option>
                        <option value="8:30 AM">8:30 AM</option>
                        <option value="9:00 AM">9:00 AM</option>
                        <option value="9:30 AM">9:30 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="6:00 PM">6:00 PM</option>
                        <option value="6:30 PM">6:30 PM</option>
                        <option value="7:00 PM">7:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Pickup */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-slate-900">Pickup Location *</Label>
                    <div className="rounded-xl border-2 border-amber-200 p-2">
                      <MapPicker
                        tourId={selectedTour?.id || ""}
                        restrictions={selectedTour?.pickupRestrictions || "flexible"}
                        onLocationSelect={(v: any) => setPickup(normPick(v))}
                        selectedLocation={pickup}
                      />
                    </div>
                    {/* native required fallback */}
                    <input
                      tabIndex={-1}
                      style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
                      value={pickup.address}
                      onChange={() => { }}
                      required
                    />
                  </div>

                  {/* Contact info */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Full Name *</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="h-12 rounded-xl border-2 border-amber-200 focus-visible:ring-amber-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Email Address *</Label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        className="h-12 rounded-xl border-2 border-amber-200 focus-visible:ring-amber-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">WhatsApp Number *</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="h-12 rounded-xl border-2 border-amber-200 focus-visible:ring-amber-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Special Requests or Dietary Restrictions</Label>
                      <Textarea
                        rows={3}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="rounded-xl border-2 border-amber-200 focus-visible:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={agreedToTerms}
                      onCheckedChange={(v) => setAgreedToTerms(Boolean(v))}
                      className="border-amber-300 data-[state=checked]:bg-amber-600"
                    />
                    <Label className="text-sm text-slate-700 leading-relaxed">
                      I agree to the terms and conditions. Payment will be collected on the day of the tour. Cancellations must be made at least 24 hours in advance.
                    </Label>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={!selectedTour || !agreedToTerms || submitting}
                    className="w-full h-12 text-lg font-semibold rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                  >
                    {submitting ? "Submitting…" : "Book Now - Pay on Tour Day"}
                  </Button>

                  {/* Contacts */}
                  <div className="text-center pt-4 border-t border-amber-200">
                    <p className="text-sm text-slate-600 mb-3">Questions? Contact us directly:</p>
                    <div className="space-y-2">
                      <a
                        href="https://wa.me/818014786114"
                        className="inline-flex items-center justify-center text-amber-600 hover:text-amber-700 font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        +81 80 1478 6114
                      </a>
                      <a
                        href="mailto:realgoodjapantour@gmail.com"
                        className="block text-amber-600 hover:text-amber-700 font-medium"
                      >
                        <Mail className="h-4 w-4 mr-2 inline" />
                        realgoodjapantour@gmail.com
                      </a>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div >
  );
}
