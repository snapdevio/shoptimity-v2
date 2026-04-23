import React from "react"
import { Check } from "lucide-react"

interface CTABadgesProps {
  trialDays?: number
  className?: string
}

const CTABadges: React.FC<CTABadgesProps> = ({ trialDays, className = "" }) => {
  return (
    <div
      className={`flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-500 sm:flex-nowrap ${className}`}
    >
      <div className="flex items-center gap-1.5 transition-colors hover:text-gray-700">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
        <span>No Hidden Charges</span>
      </div>
      <div className="flex items-center gap-1.5 transition-colors hover:text-gray-700">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
        <span>Cancel Anytime</span>
      </div>
    </div>
  )
}

export default CTABadges
