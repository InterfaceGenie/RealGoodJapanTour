"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPicker } from "@/components/map-picker"
import { useRouter } from "next/navigation"
import {
  Star,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Shield,
  Plus,
  Minus,
  MessageCircle,
  Mail,
} from "lucide-react"
import PageHeader from "@/components/page-header"

type UITour = {
  id: string
  /** REAL DB UUID for FK use */
  dbId: string
  title: string
  shortTitle?: string
  price: number
  duration: string
  maxGuests: number
  rating: number
  reviews: number
  images: string[]
  highlights: string[]
  description: string
  pickupRestrictions: string
  longDescription?: string
  itinerary: { time: string; activity: string }[]
  included: string[]
  notIncluded: string[]
  bookingNotes?: string
}

type PickerValue = { address: string; lat: number; lng: number }

// Normalize any shape from MapPicker (string or object) into {address,lat,lng}
function normalizeToPickerValue(val: any): PickerValue {
  if (!val) return { address: "", lat: 0, lng: 0 }
  if (typeof val === "string") return { address: val, lat: 0, lng: 0 }
  const address = val.address ?? val.label ?? ""
  const lat = Number.isFinite(val.lat) ? Number(val.lat) : 0
  const lng = Number.isFinite(val.lng) ? Number(val.lng) : 0
  return { address, lat, lng }
}
const toNullable = (n: number) => (Number.isFinite(n) && n !== 0 ? n : null)

// convert "6:30 PM" -> "18:30:00" (safe for Postgres time)
function toSqlTime(t: string): string {
  if (!t) return ""
  try {
    const d = new Date(`1970-01-01T${t}`)
    if (!isNaN(d.getTime())) return d.toTimeString().slice(0, 8)
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!m) return ""
    let hh = parseInt(m[1], 10)
    const mm = m[2]
    const ap = m[3].toUpperCase()
    if (ap === "PM" && hh !== 12) hh += 12
    if (ap === "AM" && hh === 12) hh = 0
    return `${String(hh).padStart(2, "0")}:${mm}:00`
  } catch {
    return ""
  }
}

export default function TourDetailPage() {
  const params = useParams()
  const routeId = params.id as string

  const [tour, setTour] = useState<UITour | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Booking state ---
  const [guests, setGuests] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [pickup, setPickup] = useState<PickerValue>({ address: "", lat: 0, lng: 0 })
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let active = true
      ; (async () => {
        setLoading(true)
        setError(null)
        const columns = `
        id, title, short_title, price, duration, max_guests,
        rating, reviews, image, highlights, description, pickup_restrictions
      `
        const { data, error } = await supabase
          .from("tours")
          .select(columns)
          .or(`id.eq.${routeId}`)
          .maybeSingle()

        if (!active) return

        if (error) {
          setError(error.message)
        } else if (!data) {
          setError("Tour not found")
        } else {
          const mapped: UITour = {
            id: (data.id as string),
            dbId: data.id, // REAL uuid
            title: data.title,
            shortTitle: data.short_title ?? undefined,
            price: Number(data.price ?? 0),
            duration: data.duration ?? "",
            maxGuests: Number(data.max_guests ?? 1),
            rating: Number(data.rating ?? 0),
            reviews: Number(data.reviews ?? 0),
            images: data.image ? [data.image] : ["/placeholder.svg"],
            highlights: Array.isArray(data.highlights) ? data.highlights : [],
            description: data.description ?? "",
            pickupRestrictions: data.pickup_restrictions ?? "flexible",
            longDescription: data.description ?? "",
            itinerary: [],
            included: [],
            notIncluded: [],
            bookingNotes: "",
          }
          setTour(mapped)
        }
        setLoading(false)
      })()

    return () => {
      active = false
    }
  }, [routeId])

  const totalPrice = (tour?.price ?? 0) * guests
  const formattedPrice = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(totalPrice)

  const handleGuestChange = (increment: boolean) => {
    if (!tour) return
    if (increment && guests < tour.maxGuests) setGuests((g) => g + 1)
    else if (!increment && guests > 1) setGuests((g) => g - 1)
  }

  // === INSERT into bookings ===
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tour) return

    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions to proceed with booking.")
      return
    }
    if (!selectedDate || !selectedTime || !customerName || !customerEmail || !customerPhone || !pickup.address) {
      alert("Please fill all required fields.")
      return
    }

    const timeSql = toSqlTime(selectedTime)
    if (!timeSql) {
      alert("Invalid time format. Please pick a time from the list.")
      return
    }

    setSubmitting(true)

    const insertPayload = {
      tour_id: tour.dbId, // REAL FK to tours.id
      tour_date: selectedDate,
      tour_time: timeSql,
      guests,
      total_price: totalPrice,
      pickup_location: pickup.address,
      pickup_lat: toNullable(pickup.lat),
      pickup_lng: toNullable(pickup.lng),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      special_requests: specialRequests || null,
      status: "pending",
      payment_status: "pending",
    }

    try {
      const { data, error } = await supabase.rpc("book_tour_atomic_by_date", {
        _tour_id: tour.dbId,
        _tour_date: selectedDate,           // 'YYYY-MM-DD'
        _tour_time: toSqlTime(selectedTime),// 'HH:MM:SS'
        _guests: guests,
        _total_price: totalPrice,
        _pickup_location: pickup.address,
        _pickup_lat: toNullable(pickup.lat),
        _pickup_lng: toNullable(pickup.lng),
        _customer_name: customerName,
        _customer_email: customerEmail,
        _customer_phone: customerPhone,
        _special_requests: specialRequests || null,
        _status: "pending",
        _payment_status: "pending",
      });

      if (error) {
        console.error("Booking failed:", error);
        alert(`Booking failed: ${error.message}`);
        return;
      }

      // data is the inserted booking row
      const ref = (data as any)?.booking_number || (data as any)?.id;
      router.push(`/confirmation?ref=${encodeURIComponent(ref)}`);
    } finally {
      setSubmitting(false)
    }

  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading tour…
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tour Not Found</h1>
          {error && <p className="text-slate-600 mb-4">{error}</p>}
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 mr-4">
                {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(
                  tour.price
                )}{" "}
                per person
              </Badge>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-amber-500 fill-current mr-1" />
                <span className="font-semibold mr-2">{tour.rating}</span>
                <span className="text-slate-500">({tour.reviews} reviews)</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
              {tour.title}
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-4xl">{tour.longDescription}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="relative">
                  <Image
                    src={tour.images[currentImageIndex] || "/placeholder.svg"}
                    alt={tour.title}
                    width={800}
                    height={400}
                    className="w-full h-96 object-cover"
                  />
                  {tour.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform flex space-x-2">
                      {tour.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-900">Tour Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center">
                      <Clock className="h-6 w-6 text-amber-600 mr-3" />
                      <div>
                        <div className="font-semibold text-slate-900">Duration</div>
                        <div className="text-slate-600">{tour.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-6 w-6 text-amber-600 mr-3" />
                      <div>
                        <div className="font-semibold text-slate-900">Group Size</div>
                        <div className="text-slate-600">1-{tour.maxGuests} guests</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-6 w-6 text-amber-600 mr-3" />
                      <div>
                        <div className="font-semibold text-slate-900">Location</div>
                        <div className="text-slate-600">Japan</div>
                      </div>
                    </div>
                  </div>

                  {!!tour.highlights.length && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Highlights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tour.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                            <span className="text-slate-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-900">Detailed Itinerary</CardTitle>
                </CardHeader>
                <CardContent>
                  {tour.itinerary.length ? (
                    <div className="space-y-4">
                      {tour.itinerary.map((item, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-amber-50/50 rounded-lg">
                          <div className="w-20 text-sm font-semibold text-amber-700 flex-shrink-0">{item.time}</div>
                          <div className="text-slate-700">{item.activity}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">Itinerary details will be provided after booking.</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900 flex items-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      What's Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(tour.included.length ? tour.included : ["English-speaking guide", "All taxes & fees"]).map(
                        (item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900 flex items-center">
                      <XCircle className="h-6 w-6 text-red-600 mr-2" />
                      Not Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(tour.notIncluded.length ? tour.notIncluded : ["Meals", "Personal expenses"]).map(
                        (item, index) => (
                          <li key={index} className="flex items-start">
                            <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm sticky top-24">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl">Book This Tour</CardTitle>
                  <CardDescription className="text-amber-100">Secure your spot on this amazing experience</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleBooking} className="space-y-6">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block text-slate-900">Number of Guests</Label>
                      <div className="flex items-center justify-between bg-amber-50 rounded-lg p-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange(false)}
                          disabled={guests <= 1}
                          className="border-amber-200"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">{guests}</div>
                          <div className="text-sm text-slate-600">{guests === 1 ? "guest" : "guests"}</div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGuestChange(true)}
                          disabled={tour && guests >= tour.maxGuests}
                          className="border-amber-200"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">
                          {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(
                            tour.price
                          )}{" "}
                          × {guests} {guests !== 1 ? "guests" : "guest"}
                        </span>
                        <span className="font-semibold text-slate-900">{formattedPrice}</span>
                      </div>
                      <div className="border-t border-amber-200 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-900">Total</span>
                          <span className="text-2xl font-bold text-amber-600">{formattedPrice}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="date" className="text-sm font-semibold mb-2 block text-slate-900">
                        Preferred Date *
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-amber-200 focus:ring-amber-500"
                        required
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="time" className="text-sm font-semibold mb-2 block text-slate-900">
                        Preferred Time *
                      </Label>
                      <select
                        id="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-200 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white"
                        required
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

                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-slate-900">Pickup Location *</Label>
                      <MapPicker
                        tourId={tour.id}
                        restrictions={tour.pickupRestrictions}
                        onLocationSelect={(val: any) => setPickup(normalizeToPickerValue(val))}
                        selectedLocation={pickup} // strict shape
                      />
                      {/* Native required fallback for custom component */}
                      <input
                        tabIndex={-1}
                        style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
                        value={pickup.address}
                        onChange={() => { }}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900">Contact Information</h3>
                      <div>
                        <Label htmlFor="name" className="text-sm font-semibold mb-2 block text-slate-900">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="border-amber-200 focus:ring-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-semibold mb-2 block text-slate-900">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="border-amber-200 focus:ring-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-semibold mb-2 block text-slate-900">
                          WhatsApp Number *
                        </Label>
                        <Input
                          id="phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="border-amber-200 focus:ring-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="requests" className="text-sm font-semibold mb-2 block text-slate-900">
                        Special Requests or Dietary Restrictions
                      </Label>
                      <Textarea
                        id="requests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any special requirements, dietary restrictions, or requests..."
                        className="border-amber-200 focus:ring-amber-500"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(v) => setAgreedToTerms(Boolean(v))}
                        className="border-amber-300 data-[state=checked]:bg-amber-600"
                      />
                      <Label htmlFor="terms" className="text-sm text-slate-700 leading-relaxed">
                        I agree to the terms and conditions. Payment will be collected on the day of the tour. Cancellations
                        must be made at least 24 hours in advance.
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={!agreedToTerms || submitting}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 text-lg font-semibold"
                    >
                      {submitting ? "Submitting…" : "Book Now - Pay on Tour Day"}
                    </Button>

                    <div className="text-center pt-4 border-t border-amber-200">
                      <p className="text-sm text-slate-600 mb-3">Questions? Contact us directly:</p>
                      <div className="space-y-2">
                        <a
                          href="https://wa.me/818014786114"
                          className="flex items-center justify-center text-amber-600 hover:text-amber-700 font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          +81 80 1478 6114
                        </a>
                        <a
                          href="mailto:realgoodjapantour@gmail.com"
                          className="flex items-center justify-center text-amber-600 hover:text-amber-700 font-medium"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          realgoodjapantour@gmail.com
                        </a>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Important Information</h3>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed mb-4">{tour.bookingNotes}</p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                        <Shield className="h-5 w-5 text-amber-600 mr-2" />
                        Booking Policy
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Payment collected on tour day</li>
                        <li>• 24-hour cancellation policy</li>
                        <li>• Weather-dependent activities may be modified</li>
                        <li>• Confirmation email sent within 2 hours</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                        <CheckCircle className="h-5 w-5 text-amber-600 mr-2" />
                        What to Bring
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Comfortable walking shoes</li>
                        <li>• Weather-appropriate clothing</li>
                        <li>• Camera for memories</li>
                        <li>• Cash for personal purchases</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
