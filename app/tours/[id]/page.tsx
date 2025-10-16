"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { ChevronLeft, ChevronRight } from "lucide-react"
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
import { priceBreakdown, fmtJPY } from "@/lib/pricing";

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

// Reviews (UI) shape
type Review = {
  id: string
  name: string
  rating: number
  date: string // ISO string (from trip_date)
  text: string
}

// Raw DB row shape
type DBReviewRow = {
  id: string
  customer_name: string
  rating: number
  review_text: string | null
  trip_date: string
}

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

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  // Review filters UI 
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")          // newest | highest | lowest
  const [q, setQ] = useState("")

  //Padington
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;
  const reviewsTopRef = useRef<HTMLDivElement | null>(null);

  // --- COUPONS ---
  type Coupon = { ref: string; title: string | null; discount: number }

  const [couponRef, setCouponRef] = useState("")
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Clamp discount to [0, 100]
  const appliedDiscountPct = coupon ? Math.min(Math.max(coupon.discount, 0), 100) : 0

  const handleApplyCoupon = async () => {
    if (!couponRef.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      // Case-insensitive match on ref
      const { data, error } = await supabase
        .from("coupons")
        .select("ref,title,discount")
        .ilike("ref", couponRef.trim()) // e.g. 'FALL10' or 'fall10'
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setCoupon(null)
        setCouponError("Coupon not found.")
        return
      }

      // Expect discount as % (0–100)
      const pct = Number(data.discount ?? 0)
      if (!Number.isFinite(pct) || pct <= 0) {
        setCoupon(null)
        setCouponError("This coupon has no discount.")
        return
      }

      setCoupon({ ref: data.ref, title: data.title ?? null, discount: pct })
    } catch (e: any) {
      setCoupon(null)
      setCouponError(e?.message ?? "Failed to apply coupon.")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCoupon(null)
    setCouponRef("")
    setCouponError(null)
  }
  const breakdown = priceBreakdown({
    pricePerPerson: tour?.price ?? 0,
    guests,
    soloMultiplier: 2,                      // matches “(¥xx,xxx if only one participant)”
    couponPercent: coupon?.discount ?? 0,   // your coupon % from DB
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
  const formattedSubtotalAfterGrp = fmtJPY(subtotalAfterGroup);
  const formattedCouponAmount = couponAmount ? `− ${fmtJPY(couponAmount)}` : undefined;
  const formattedTotal = fmtJPY(total);


  // reset to first page on change
  useEffect(() => {
    setPage(1);
  }, [q, ratingFilter, sortBy]);

  useEffect(() => {
    reviewsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

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
  // Pic gallery here
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    if (!tour?.dbId) return;
    let cancelled = false;

    (async () => {
      try {
        setGalleryLoading(true);
        const folder = tour.dbId.trim();
        // List files in the tour folder
        const { data, error } = await supabase
          .storage
          .from("Tours")
          .list(folder, {
            limit: 100,
            sortBy: { column: "name", order: "asc" }
          });

        if (cancelled) return;

        if (error) {
          console.error("[Storage Error]", error);
          // Fallback: use placeholder or try alternative approach
          return;
        }

        if (!data || data.length === 0) {
          console.log("[Storage] No files found in folder:", folder);
          return;
        }

        // Filter and map image URLs
        const imageUrls = data
          .filter(file => {
            const extension = file.name.toLowerCase().split('.').pop();
            return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(extension || '');
          })
          .map(file =>
            supabase.storage.from("Tours").getPublicUrl(`${folder}/${file.name}`).data.publicUrl
          );

        if (!cancelled && imageUrls.length > 0) {
          setTour(t => (t ? { ...t, images: imageUrls } : t));
        }
      } catch (err) {
        console.error("[Storage Exception]", err);
      } finally {
        if (!cancelled) {
          setGalleryLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [tour?.dbId]);

  // Safe images array
  const images = tour?.images?.length
    ? tour.images
    : ['data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" font-size="32" text-anchor="middle" fill="%23999" dy=".3em">No image</text></svg>'];
  // Keep index in range whenever images change
  useEffect(() => {
    if (currentImageIndex >= images.length) setCurrentImageIndex(0)
  }, [images.length])

  const goPrev = () => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)
  const goNext = () => setCurrentImageIndex(i => (i + 1) % images.length)

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (images.length <= 1) return
    if (e.key === "ArrowLeft") goPrev()
    if (e.key === "ArrowRight") goNext()
  }



  // Fetch reviews for this tour once tour is known
  useEffect(() => {
    if (!tour?.dbId) return
    let active = true
      ; (async () => {
        setReviewsLoading(true)
        setReviewsError(null)
        const { data, error } = await supabase
          .from("reviews")
          .select("id, customer_name, rating, review_text, trip_date")
          .eq("tour_id", tour.dbId)
          .order("trip_date", { ascending: false })

        if (!active) return
        if (error) {
          setReviewsError(error.message)
          setReviews([])
        } else {
          const mapped: Review[] = (data as DBReviewRow[]).map(r => ({
            id: r.id,
            name: r.customer_name,
            rating: Number(r.rating || 0),
            date: r.trip_date,
            text: r.review_text ?? ""
          }))
          setReviews(mapped)
        }
        setReviewsLoading(false)
      })()

    return () => { active = false }
  }, [tour?.dbId])

  const handleGuestChange = (increment: boolean) => {
    if (!tour) return
    if (increment && guests < tour.maxGuests) setGuests((g) => g + 1)
    else if (!increment && guests > 1) setGuests((g) => g - 1)
  }
  // Convert anything (number or "￥120,000") to a plain integer yen
  const toYenNumber = (v: any) => {
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    const n = Number(String(v).replace(/[^\d.-]/g, "")); // strips ￥ and commas
    return Number.isFinite(n) ? Math.round(n) : 0;
  };

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

    try {
      const { data, error } = await supabase.rpc("book_tour_atomic_by_date", {
        _tour_id: tour.dbId,
        _tour_date: selectedDate,
        _tour_time: toSqlTime(selectedTime),
        _guests: guests,
        _total_price: toYenNumber(total),   // <— use the sanitizer here
        _pickup_location: pickup.address,
        _pickup_lat: toNullable(pickup.lat),
        _pickup_lng: toNullable(pickup.lng),
        _customer_name: customerName,
        _customer_email: customerEmail,
        _customer_phone: customerPhone,
        _special_requests: specialRequests || null,
        _status: "pending",
        _payment_status: "pending",
        _coupon_ref: coupon?.ref ?? null,
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

  // --- Reviews helpers ---
  const filteredReviews = reviews
    .filter(r => ratingFilter === "all" ? true : ratingFilter === "3" ? r.rating >= 3 : r.rating === Number(ratingFilter))
    .filter(r => (q ? (r.text + " " + r.name).toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => {
      if (sortBy === "newest") return (+new Date(b.date)) - (+new Date(a.date))
      if (sortBy === "highest") return b.rating - a.rating
      if (sortBy === "lowest") return a.rating - b.rating
      return 0
    })

  const avgRating =
    reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0

  const Stars = ({ value }: { value: number }) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 mr-0.5 ${i < value ? "text-amber-500 fill-current" : "text-slate-300"}`}
          />
        ))}
      </div>
    )
  }


  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PER_PAGE));
  const pageStart = (page - 1) * PER_PAGE;
  const pagedReviews = filteredReviews.slice(pageStart, pageStart + PER_PAGE);

  const showingFrom = filteredReviews.length ? pageStart + 1 : 0;
  const showingTo = Math.min(pageStart + pagedReviews.length, filteredReviews.length);

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
                <span className="ml-2 text-sm">{avgRating} / 5 · {reviews.length} reviews</span>
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
                <div
                  className="relative group"
                  tabIndex={0}
                  onKeyDown={onKeyDown}
                  aria-label="Tour gallery"
                >
                  {/* Main image */}
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${tour.title} — image ${currentImageIndex + 1} of ${images.length}`}
                    width={1200}
                    height={600}
                    className="w-full h-96 object-cover"
                    unoptimized
                  />

                  {/* Index badge */}
                  {images.length > 1 && (
                    <div className="absolute right-3 top-3 rounded-md bg-black/50 text-white text-xs px-2 py-1">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Prev/Next controls */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition"
                      >
                        <ChevronLeft className="h-5 w-5 text-slate-800" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition"
                      >
                        <ChevronRight className="h-5 w-5 text-slate-800" />
                      </button>
                    </>
                  )}

                  {/* Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform flex space-x-2 bg-black/20 rounded-full px-2 py-1">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`Go to image ${index + 1}`}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                            }`}
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
                      {(tour.included.length ? tour.included : ["Tours with car service include ticket fees, parking fee, highway fee", "Full english guidance"]).map(
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
                      {(tour.notIncluded.length ? tour.notIncluded : ["Walking tours do not include any entrance ticket fees.", "Personal expenses", "Food and drinks are not included in any tour."]).map(
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

              {/* Reviews */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">Traveler Reviews</CardTitle>
                      <div className="mt-2 flex items-center text-slate-600">
                        <Stars value={Math.round(avgRating)} />
                        <span className="ml-2 text-sm">{avgRating} / 5 · {reviews.length} reviews</span>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search reviews…"
                        className="px-3 py-2 border border-amber-200 rounded-md bg-white text-sm"
                      />
                      <select
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        className="px-3 py-2 border border-amber-200 rounded-md bg-white text-sm"
                      >
                        <option value="all">All ratings</option>
                        <option value="5">5 stars</option>
                        <option value="4">4 stars</option>
                        <option value="3">3 stars & up</option>
                      </select>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-amber-200 rounded-md bg-white text-sm"
                      >
                        <option value="newest">Newest</option>
                        <option value="highest">Highest rating</option>
                        <option value="lowest">Lowest rating</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {reviewsLoading && (
                    <div className="text-slate-600 text-sm">Loading reviews…</div>
                  )}
                  {reviewsError && (
                    <div className="text-red-600 text-sm">Failed to load reviews: {reviewsError}</div>
                  )}
                  {!reviewsLoading && !reviewsError && filteredReviews.length === 0 && (
                    <div className="text-slate-600 text-sm">No reviews match your filter.</div>
                  )}
                </CardContent>
                <CardContent className="space-y-4">
                  <div ref={reviewsTopRef} />

                  {reviewsLoading && (
                    <div className="text-slate-600 text-sm">Loading reviews…</div>
                  )}
                  {reviewsError && (
                    <div className="text-red-600 text-sm">Failed to load reviews: {reviewsError}</div>
                  )}
                  {!reviewsLoading && !reviewsError && filteredReviews.length === 0 && (
                    <div className="text-slate-600 text-sm">No reviews match your filter.</div>
                  )}

                  {pagedReviews.map((r) => (
                    <div key={r.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white/70">
                      <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-semibold">
                        {(r.name || "G").slice(0, 1)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-900">{r.name}</div>
                          <div className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</div>
                        </div>
                        <div className="mt-1 flex items-center">
                          <Stars value={r.rating} />
                          <span className="ml-2 text-sm text-slate-600">{r.rating}.0</span>
                        </div>
                        <p className="mt-2 text-slate-700 leading-relaxed">{r.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Pagination footer */}
                  {filteredReviews.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="text-xs text-slate-600">
                        Showing <span className="font-medium">{showingFrom}</span>–<span className="font-medium">{showingTo}</span> of{" "}
                        <span className="font-medium">{filteredReviews.length}</span> reviews
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className={`px-3 py-1.5 text-sm rounded-md border border-amber-200 bg-white hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Previous
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={[
                                "w-8 h-8 rounded-md text-sm border",
                                p === page
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-white border-amber-200 hover:bg-amber-50 text-slate-700",
                              ].join(" ")}
                              aria-current={p === page ? "page" : undefined}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className={`px-3 py-1.5 text-sm rounded-md border border-amber-200 bg-white hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* booking session */}
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
                          {fmtJPY(tour.price)} × {guests} {guests !== 1 ? "guests" : "guest"}
                          {soloApplied && " (solo rate applied)"}
                        </span>
                        <span className="font-semibold text-slate-900">{formattedBaseTotal}</span>
                      </div>

                      {/* Group discount row (auto from rules) */}
                      {groupDiscountPercent > 0 && (
                        <div className="mt-2 flex justify-between items-center text-sm">
                          <div className="text-emerald-700">
                            Group discount — {groupDiscountPercent}% off
                          </div>
                          <div className="text-emerald-700">{formattedGroupDiscount}</div>
                        </div>
                      )}

                      {/* Subtotal after group discount */}
                      {groupDiscountPercent > 0 && (
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-semibold text-slate-900">{formattedSubtotalAfterGrp}</span>
                        </div>
                      )}

                      {/* Coupon input */}
                      <div className="mt-3 flex gap-2">
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
                      </div>
                      {/* Coupon row */}
                      {couponPercent > 0 && (
                        <div className="mt-3 flex justify-between items-center text-sm">
                          <div className="text-emerald-700">
                            {coupon?.title ? `${coupon.title} ` : "Coupon"} ({coupon?.ref || ""}) — {couponPercent}% off
                          </div>
                          <div className="text-emerald-700">{formattedCouponAmount}</div>
                        </div>
                      )}
                      <div className="border-t border-amber-200 mt-3 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-900">Total</span>
                          <span className="text-2xl font-bold text-amber-600">{formattedTotal}</span>
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
                        <Shield className="h-5 w-5 text-amber-600 mr-a2" />
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
    </div >
  )
}
