import React from "react"
import { Check } from "lucide-react"

interface CTABadgesProps {
  trialDays?: number
  isFree?: boolean
  className?: string
}

const CTABadges: React.FC<CTABadgesProps> = ({
  trialDays = 3,
  isFree = false,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-500 sm:flex-nowrap ${className}`}
    >
      <div className="flex items-center gap-1.5 transition-colors hover:text-gray-700">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
        <span>{isFree ? "Free Access" : `${trialDays} Day Free Trial`}</span>
      </div>
      <div className="flex items-center gap-1.5 transition-colors hover:text-gray-700">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
        <span>No Hidden Charges</span>
      </div>
    </div>
  )
}

export default CTABadges
