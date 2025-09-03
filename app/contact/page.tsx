"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Mail, Clock, MessageCircle } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import PageHeader from "@/components/page-header"

export default function ContactPage() {
  // form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [tourInterest, setTourInterest] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // submit to Supabase
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const { error } = await supabase.from("inquiry").insert({
      first_name: firstName,
      last_name: lastName,
      email,
      whatsapp,
      tour_interest: tourInterest,
      message,
    })
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess(true)
      setFirstName(""); setLastName(""); setEmail(""); setWhatsapp(""); setTourInterest(""); setMessage("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-amber-800 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Ready to embark on your luxury Japan adventure? We're here to help you create unforgettable memories.
              Contact us today to start planning your personalized journey.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl">Contact Information</CardTitle>
                  <CardDescription className="text-amber-100">
                    Reach out to us through any of these channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">WhatsApp</h3>
                      <p className="text-slate-600 mb-2">For instant communication and quick responses</p>
                      <a
                        href="https://wa.me/818014786114"
                        className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        +81 80 1478 6114
                        <MessageCircle className="h-4 w-4 ml-2" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Email</h3>
                      <p className="text-slate-600 mb-2">For detailed inquiries and bookings</p>
                      <a
                        href="mailto:realgoodjapantour@gmail.com"
                        className="text-amber-600 hover:text-amber-700 font-medium"
                      >
                        realgoodjapantour@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Location</h3>
                      <p className="text-slate-600 mb-2">Based in the heart of Japan</p>
                      <p className="text-amber-600 font-medium">Osaka & Kyoto, Japan</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Response Time</h3>
                      <p className="text-slate-600 mb-2">We typically respond within</p>
                      <p className="text-amber-600 font-medium">2-4 hours (JST)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-amber-600" />
                    Quick Contact Tips
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      WhatsApp is the fastest way to reach us for immediate questions
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Email us for detailed tour customizations and group bookings
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Include your preferred dates and group size for faster responses
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form className="space-y-6" onSubmit={onSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-semibold mb-2 block text-slate-900">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-semibold mb-2 block text-slate-900">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold mb-2 block text-slate-900">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp" className="text-sm font-semibold mb-2 block text-slate-900">
                      WhatsApp Number
                    </Label>
                    <Input
                      id="whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tourInterest" className="text-sm font-semibold mb-2 block text-slate-900">
                      Tour Interest
                    </Label>
                    <select
                      id="tourInterest"
                      value={tourInterest}
                      onChange={(e) => setTourInterest(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="">Select a tour (optional)</option>
                      <option value="kyoto-full-day">Full Day Tour of Kyoto</option>
                      <option value="osaka-food-hopping">Osaka Food Hopping Tour</option>
                      <option value="imperial-osaka">Imperial Osaka Castle & Elite Districts</option>
                      <option value="custom-tour">Customized Private Tour</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-semibold mb-2 block text-slate-900">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your dream Japan experience, preferred dates, group size, and any special requirements..."
                      required
                      className="border-amber-200 focus:ring-amber-500 focus:border-amber-500 min-h-[120px]"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-green-700 text-sm">
                      Thank you! Your message has been sent.
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 text-lg font-semibold disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <Card className="shadow-xl border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Start Your Adventure?</h2>
                <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
                  Don't wait to experience the magic of Japan. Our luxury tours are designed to create memories that last a lifetime.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-8 py-3"
                    asChild
                  >
                    <Link href="/booking">Book Your Tour Now</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-8 py-3"
                    asChild
                  >
                    <a href="https://wa.me/818014786114" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      WhatsApp Us
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
