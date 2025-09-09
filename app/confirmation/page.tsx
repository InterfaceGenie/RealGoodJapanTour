"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function ConfirmationPage() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;

    let active = true;
    (async () => {
      setError(null);

      // try booking_number first
      let { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_number", ref)
        .maybeSingle();

      if (!data && !error) {
        const res = await supabase.from("bookings").select("*").eq("id", ref).maybeSingle();
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

  if (!ref) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Missing booking reference.</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">{error}</div>;
  }

  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading booking…</div>;
  }

  const reference = booking.booking_number || booking.id;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
      {/* Header with spacing below */}
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
