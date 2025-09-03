"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Navigation, Clock } from 'lucide-react'

interface MapPickerProps {
  tourId: string
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
  selectedLocation?: { address: string; lat: number; lng: number } | null
}

export function MapPicker({ tourId, onLocationSelect, selectedLocation }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Pickup restrictions based on tour
  const getPickupRestrictions = (tourId: string) => {
    switch (tourId) {
      case "kyoto-full":
      case "1":
        return {
          areas: ["Kyoto", "Osaka"],
          description: "Pickup available in Kyoto or Osaka areas. We'll pick you up at your hotel/accommodation.",
          searchable: true
        }
      case "osaka-food":
      case "2":
        return {
          fixedLocation: "Dotonbori Bridge, 1 Chome-10 Dotonbori, Chuo Ward, Osaka, 542-0071, Japan",
          description: "Meeting point is fixed at Dotonbori Bridge. Look for your guide with a 'Real Good Japan Tour' sign.",
          searchable: false
        }
      case "imperial-osaka":
      case "3":
        return {
          areas: ["Osaka", "Kyoto"],
          description: "Pickup available in Osaka or Kyoto areas. Premium hotel pickup service included.",
          searchable: true
        }
      case "4":
        return {
          areas: ["Kyoto", "Osaka", "Kobe", "Nara", "Other"],
          description: "Flexible pickup locations available throughout Kansai region.",
          searchable: true
        }
      default:
        return {
          areas: ["Kyoto", "Osaka", "Kobe"],
          description: "Flexible pickup locations available in Kansai region.",
          searchable: true
        }
    }
  }

  const restrictions = getPickupRestrictions(tourId)

  // Mock location data with realistic Japanese locations
  const mockLocations = [
    // Kyoto locations
    { address: "Kyoto Station, Kyoto, Japan", lat: 34.9858, lng: 135.7581, type: "Station", area: "Kyoto" },
    { address: "Gion District, Kyoto, Japan", lat: 35.0036, lng: 135.7778, type: "District", area: "Kyoto" },
    { address: "Kiyomizu-dera Temple, Kyoto, Japan", lat: 34.9949, lng: 135.7851, type: "Temple", area: "Kyoto" },
    { address: "Arashiyama, Kyoto, Japan", lat: 35.0170, lng: 135.6761, type: "District", area: "Kyoto" },
    { address: "Fushimi Inari Shrine, Kyoto, Japan", lat: 34.9671, lng: 135.7727, type: "Shrine", area: "Kyoto" },
    { address: "Kyoto Imperial Palace, Kyoto, Japan", lat: 35.0253, lng: 135.7625, type: "Palace", area: "Kyoto" },
    
    // Osaka locations
    { address: "Osaka Station, Osaka, Japan", lat: 34.7024, lng: 135.4959, type: "Station", area: "Osaka" },
    { address: "Dotonbori, Osaka, Japan", lat: 34.6686, lng: 135.5023, type: "District", area: "Osaka" },
    { address: "Osaka Castle, Osaka, Japan", lat: 34.6873, lng: 135.5262, type: "Castle", area: "Osaka" },
    { address: "Shinsaibashi, Osaka, Japan", lat: 34.6751, lng: 135.5018, type: "Shopping", area: "Osaka" },
    { address: "Namba Station, Osaka, Japan", lat: 34.6661, lng: 135.5006, type: "Station", area: "Osaka" },
    { address: "Sumiyoshi Taisha, Osaka, Japan", lat: 34.6180, lng: 135.4942, type: "Shrine", area: "Osaka" },
    { address: "Universal Studios Japan, Osaka, Japan", lat: 34.6654, lng: 135.4321, type: "Theme Park", area: "Osaka" },
    
    // Kobe locations
    { address: "Kobe Station, Kobe, Japan", lat: 34.6760, lng: 135.1875, type: "Station", area: "Kobe" },
    { address: "Kobe Port Tower, Kobe, Japan", lat: 34.6823, lng: 135.1864, type: "Landmark", area: "Kobe" },
    { address: "Kitano Foreign District, Kobe, Japan", lat: 34.6953, lng: 135.1897, type: "District", area: "Kobe" },
    { address: "Rokko Mountain, Kobe, Japan", lat: 34.7326, lng: 135.2320, type: "Mountain", area: "Kobe" },
    
    // Nara locations
    { address: "Nara Station, Nara, Japan", lat: 34.6851, lng: 135.8048, type: "Station", area: "Nara" },
    { address: "Nara Park, Nara, Japan", lat: 34.6851, lng: 135.8432, type: "Park", area: "Nara" },
    { address: "Todaiji Temple, Nara, Japan", lat: 34.6890, lng: 135.8398, type: "Temple", area: "Nara" },
    
    // Hotels
    { address: "Hotel Granvia Kyoto, Kyoto Station", lat: 34.9858, lng: 135.7581, type: "Hotel", area: "Kyoto" },
    { address: "The Ritz-Carlton Kyoto", lat: 35.0036, lng: 135.7714, type: "Hotel", area: "Kyoto" },
    { address: "Hotel Granvia Osaka, Osaka Station", lat: 34.7024, lng: 135.4959, type: "Hotel", area: "Osaka" },
    { address: "The St. Regis Osaka", lat: 34.6751, lng: 135.5018, type: "Hotel", area: "Osaka" },
    { address: "ANA Crowne Plaza Kobe", lat: 34.6760, lng: 135.1875, type: "Hotel", area: "Kobe" }
  ]

  // Search function with area filtering
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      let filteredSuggestions = mockLocations.filter(place => 
        place.address.toLowerCase().includes(query.toLowerCase())
      )

      // Filter by allowed areas if restrictions exist
      if (restrictions.areas) {
        filteredSuggestions = filteredSuggestions.filter(place => 
          restrictions.areas!.includes(place.area) || restrictions.areas!.includes("Other")
        )
      }

      // Sort by relevance (exact matches first, then partial matches)
      filteredSuggestions.sort((a, b) => {
        const aExact = a.address.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0
        const bExact = b.address.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0
        return bExact - aExact
      })

      setSuggestions(filteredSuggestions.slice(0, 8)) // Limit to 8 suggestions
      setShowSuggestions(true)
      setIsLoading(false)
    }, 300)
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (restrictions.searchable) {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, restrictions.searchable])

  const handleLocationClick = (location: any) => {
    onLocationSelect(location)
    setSearchQuery(location.address)
    setShowSuggestions(false)
  }

  // Fixed location for Osaka Food Tour
  if (!restrictions.searchable && restrictions.fixedLocation) {
    return (
      <div className="space-y-4">
        <Label className="text-lg font-semibold text-slate-900">Meeting Point</Label>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <p className="font-semibold text-slate-900">Fixed Meeting Location</p>
              <p className="text-slate-700 mt-1">{restrictions.fixedLocation}</p>
              <p className="text-sm text-slate-600 mt-2">{restrictions.description}</p>
              <div className="flex items-center mt-3 text-sm text-amber-700">
                <Clock className="h-4 w-4 mr-1" />
                <span>Please arrive 10 minutes early</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(restrictions.fixedLocation)}`, '_blank')}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Open in Google Maps
          </Button>
        </div>
      </div>
    )
  }

  // Searchable pickup location for other tours
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold text-slate-900">Select Pickup Location</Label>
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Pickup Areas:</strong> {restrictions.areas?.join(", ")}
        </p>
        <p className="text-sm text-blue-700 mt-1">{restrictions.description}</p>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search for your hotel, station, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            className="pl-10 border-amber-200 focus:ring-amber-500"
          />
        </div>
        
        {isLoading && (
          <div className="absolute top-full left-0 right-0 bg-white border border-amber-200 rounded-b-lg p-3 shadow-lg z-10">
            <p className="text-sm text-slate-500">Searching locations...</p>
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && !isLoading && (
          <div className="absolute top-full left-0 right-0 bg-white border border-amber-200 rounded-b-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleLocationClick(suggestion)}
                className="w-full text-left p-3 hover:bg-amber-50 border-b border-amber-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{suggestion.address}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                        {suggestion.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        {suggestion.area}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && suggestions.length === 0 && !isLoading && searchQuery && (
          <div className="absolute top-full left-0 right-0 bg-white border border-amber-200 rounded-b-lg p-3 shadow-lg z-10">
            <p className="text-sm text-slate-500">No locations found. Try searching for hotels, stations, or landmarks in {restrictions.areas?.join(", ")}.</p>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <p className="font-semibold text-green-800">Selected Pickup Location</p>
              <p className="text-green-700 mt-1">{selectedLocation.address}</p>
              <p className="text-sm text-green-600 mt-2">Our guide will meet you at this location at the scheduled time.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => window.open(`https://maps.google.com/?q=${selectedLocation.lat},${selectedLocation.lng}`, '_blank')}
          >
            <Navigation className="h-4 w-4 mr-2" />
            View on Map
          </Button>
        </div>
      )}
    </div>
  )
}
