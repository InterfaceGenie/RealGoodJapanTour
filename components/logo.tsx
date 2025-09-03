import { Crown, Sparkles } from 'lucide-react'

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <Crown className="h-10 w-10 text-amber-600" />
        <Sparkles className="h-4 w-4 text-amber-400 absolute -top-1 -right-1" />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 bg-clip-text text-transparent">
          Real Good Japan Tour
        </h1>
        <p className="text-xs text-amber-600/80 font-medium tracking-wide">LUXURY EXPERIENCES</p>
      </div>
    </div>
  )
}
