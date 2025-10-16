"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";


type Booking = {
  id: string;
  booking_number: string | null;
  tour_id: string;
  tour_date: string;
  tour_time: string;
  guests: number;
  total_price: number;
  pickup_location: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  special_requests: string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
};

function ConfirmationInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref");

  type Booking = {
    id: string;
    booking_number: string | null;
    tour_id: string;
    tour_date: string;
    tour_time: string;
    guests: number;
    total_price: number;
    pickup_location: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    special_requests: string | null;
    status: string | null;
    payment_status: string | null;
    created_at: string;
    coupon_ref: string | null;
    coupon_counted: boolean;
  };

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    let active = true;
    (async () => {
      setError(null);

      let { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          coupon_ref,
          coupon_counted
        `)
        .eq("booking_number", ref)
        .maybeSingle();

      if (!data && !error) {
        const res = await supabase
          .from("bookings")
          .select(`*, coupon_ref, coupon_counted`)
          .eq("id", ref)
          .maybeSingle();
        data = res.data as any;
        error = res.error as any;
      }

      if (!active) return;

      if (error) setError(error.message);
      else if (!data) setError("Booking not found");
      else setBooking(data as Booking);
    })();

    return () => {
      active = false;
    };
  }, [ref]);

  useEffect(() => {
    if (!booking) return;


    if (!booking.coupon_ref || booking.coupon_counted) return;

    let cancelled = false;
    (async () => {
      try {
        setCounting(true);

        // 1) Read current times
        const { data: couponRow, error: selErr } = await supabase
          .from("coupons")
          .select("times")
          .eq("ref", booking.coupon_ref.trim())
          .maybeSingle();

        if (selErr) throw selErr;
        if (!couponRow) throw new Error("Coupon not found for ref " + booking.coupon_ref);

        const nextTimes = (couponRow.times ?? 0) + 1;

        // 2) Write times + 1
        const { error: updCouponErr } = await supabase
          .from("coupons")
          .update({ times: nextTimes })
          .eq("ref", booking.coupon_ref.trim());

        if (updCouponErr) throw updCouponErr;

        // 3) Mark booking as counted so we don't double count on refresh
        const { error: updBookingErr } = await supabase
          .from("bookings")
          .update({ coupon_counted: true })
          .eq("id", booking.id);

        if (updBookingErr) throw updBookingErr;

        if (!cancelled) {
          setBooking((b) => (b ? { ...b, coupon_counted: true } : b));
        }
      } catch (e: any) {
        console.error("Coupon increment failed:", e?.message || e);
      } finally {
        if (!cancelled) setCounting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [booking]);


  if (!ref) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Missing booking reference.
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        {error}
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading booking…
      </div>
    );
  }

  const reference = booking.booking_number || booking.id;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
      <PageHeader />
      <div className="flex-1 container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto shadow-xl border border-slate-200 bg-white/90 backdrop-blur-md rounded-2xl">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-3xl font-bold text-center text-slate-900">
              Booking Confirmed 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700 pt-6">
            <div className="grid grid-cols-2 gap-y-2 text-sm sm:text-base">
              <span className="font-semibold">Reference:</span>
              <span>{reference}</span>
              <span className="font-semibold">Name:</span>
              <span>{booking.customer_name}</span>
              <span className="font-semibold">Email:</span>
              <span>{booking.customer_email}</span>
              <span className="font-semibold">Phone:</span>
              <span>{booking.customer_phone}</span>
              <span className="font-semibold">Guests:</span>
              <span>{booking.guests}</span>
              <span className="font-semibold">Date:</span>
              <span>{booking.tour_date}</span>
              <span className="font-semibold">Time:</span>
              <span>{booking.tour_time}</span>
              <span className="font-semibold">Pickup:</span>
              <span>{booking.pickup_location}</span>

              {booking.coupon_ref && (
                <>
                  <span className="font-semibold">Coupon:</span>
                  <span>
                    {booking.coupon_ref}
                    {counting ? " (applying…)" : booking.coupon_counted ? " (applied)" : ""}
                  </span>
                </>
              )}

              {booking.special_requests && (
                <>
                  <span className="font-semibold">Special Requests:</span>
                  <span>{booking.special_requests}</span>
                </>
              )}
              <span className="font-semibold">Status:</span>
              <span className="capitalize">{booking.status || "pending"}</span>
              <span className="font-semibold">Payment:</span>
              <span className="capitalize">{booking.payment_status || "pending"}</span>
              <span className="font-semibold">Created At:</span>
              <span>{new Date(booking.created_at).toLocaleString()}</span>
            </div>

            <div className="pt-6 text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-600">Loading…</div>}>
      <ConfirmationInner />
    </Suspense>
  );
}
