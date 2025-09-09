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

type UITour = {
  id: string;        // human-facing id (external_id || id)
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

  // fetch tours (only real columns)
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);

      const columns = `
        id, external_id, title, short_title, price, duration, max_guests,
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
        id: (t.external_id as string) || (t.id as string),
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

  const totalPrice = (selectedTour?.price ?? 0) * guests;
  const formattedPrice = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(totalPrice);

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
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        tour_id: selectedTour.dbId,       // ✅ uuid
        tour_date: selectedDate,
        tour_time: sqlTime,
        guests,
        total_price: totalPrice,
        pickup_location: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        special_requests: specialRequests || null,
        status: "pending",
        payment_status: "pending",
      })
      .select("id, booking_number")
      .single();
    setSubmitting(false);

    if (error) {
      console.error("Insert error:", error);
      alert(`Booking failed: ${error.message}`);
      return;
    }

    const ref = data?.booking_number || data?.id;
    router.push(`/confirmation?ref=${ref}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading tours…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-slate-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageHeader />

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* GRID of tours */}
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Choose Your Tour</h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => {
            const active = t.id === selectedId;
            return (
              <Card
                key={t.id}
                className={`overflow-hidden border ${active ? "border-amber-400 shadow-amber-200 shadow-lg" : "border-slate-200 shadow"} transition`}
              >
                <div className="relative h-48 w-full">
                  <Image src={t.image || "/placeholder.svg"} alt={t.title} fill className="object-cover" />
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-slate-900 line-clamp-2">{t.title}</div>
                    <Badge className="ml-3 bg-amber-100 text-amber-800 border-amber-200">
                      {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(t.price)}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Star className="h-4 w-4 text-amber-500 fill-current mr-1" /> {t.rating} · {t.reviews} reviews
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5 mr-1" /> {t.duration}
                  </div>
                  <Button onClick={() => onChooseTour(t.id)} className="w-full mt-3 bg-gradient-to-r from-amber-600 to-orange-600">
                    {active ? "Selected" : "Select"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {!tours.length && <div className="text-slate-600">No tours found.</div>}
        </div>

        {/* DETAILS + BOOKING FORM (same feel as tour page) */}
        <div ref={formRef} className="mt-12 grid lg:grid-cols-2 gap-10">
          {/* Left: selected tour overview */}
          <div>
            {selectedTour ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-900">{selectedTour.title}</CardTitle>
                  <CardDescription className="text-slate-600">
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="inline-flex items-center"><Clock className="h-5 w-5 text-amber-600 mr-2" /> {selectedTour.duration}</span>
                      <span className="inline-flex items-center"><Users className="h-5 w-5 text-amber-600 mr-2" /> 1–{selectedTour.maxGuests} guests</span>
                      <span className="inline-flex items-center"><MapPin className="h-5 w-5 text-amber-600 mr-2" /> Japan</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTour.image && (
                    <div className="relative h-60 w-full rounded-lg overflow-hidden">
                      <Image src={selectedTour.image} alt={selectedTour.title} fill className="object-cover" />
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
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm"><CardContent className="p-8">Select a tour above to see details.</CardContent></Card>
            )}
          </div>

          {/* Right: booking form (same fields/UX) */}
          <div>
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Book This Tour</CardTitle>
                <CardDescription className="text-amber-100">
                  {selectedTour
                    ? `${new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(selectedTour.price)} per person`
                    : "Select a tour first"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">
                        {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(selectedTour?.price ?? 0)}
                        {" "}× {guests} {guests !== 1 ? "guests" : "guest"}
                      </span>
                      <span className="font-semibold text-slate-900">{formattedPrice}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Preferred Date *</Label>
                      <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Preferred Time *</Label>
                      <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
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

                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-slate-900">Pickup Location *</Label>
                    <MapPicker
                      tourId={selectedTour?.id || ""}
                      restrictions={selectedTour?.pickupRestrictions || "flexible"}
                      onLocationSelect={(v: any) => setPickup(normPick(v))}
                      selectedLocation={pickup}
                    />
                    {/* hidden input to satisfy native required for custom component */}
                    <input tabIndex={-1} style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
                      value={pickup.address} onChange={() => { }} required />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Full Name *</Label>
                      <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Email Address *</Label>
                      <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">WhatsApp Number *</Label>
                      <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Special Requests</Label>
                      <Textarea rows={3} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(Boolean(v))} />
                    <Label className="text-sm text-slate-700 leading-relaxed">
                      I agree to the terms and conditions. Payment will be collected on the day of the tour. Cancellations must be made at least 24 hours in advance.
                    </Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button type="button" variant="outline" onClick={() => setGuests((g) => Math.max(1, g - 1))}>−</Button>
                      <div className="text-lg font-semibold">{guests}</div>
                      <Button type="button" variant="outline" onClick={() => setGuests((g) => Math.min(selectedTour?.maxGuests ?? 1, g + 1))}>+</Button>
                    </div>
                    <Button type="submit" disabled={!selectedTour || !agreedToTerms || submitting}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                      {submitting ? "Submitting…" : "Book Now - Pay on Tour Day"}
                    </Button>
                  </div>

                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-slate-600 mb-3">Questions? Contact us directly:</p>
                    <div className="space-y-2">
                      <a href="https://wa.me/818014786114" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-amber-600">
                        <MessageCircle className="h-4 w-4 mr-2" /> +81 80 1478 6114
                      </a>
                      <a href="mailto:realgoodjapantour@gmail.com" className="flex items-center justify-center text-amber-600">
                        <Mail className="h-4 w-4 mr-2" /> realgoodjapantour@gmail.com
                      </a>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
