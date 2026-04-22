"use client"

import React, { createContext, useContext } from "react"

interface BasePriceContextType {
  basePrice: string
  templateCount: number
  trialDays: number
  loading: boolean
}

const BasePriceContext = createContext<BasePriceContextType>({
  basePrice: "$79",
  templateCount: 0,
  trialDays: 0,
  loading: false,
})

export const BasePriceProvider = ({
  children,
  initialBasePrice,
  initialTemplateCount,
  initialTrialDays,
}: {
  children: React.ReactNode
  initialBasePrice: string
  initialTemplateCount: number
  initialTrialDays: number
}) => {
  return React.createElement(
    BasePriceContext.Provider,
    {
      value: {
        basePrice: initialBasePrice,
        templateCount: initialTemplateCount,
        trialDays: initialTrialDays,
        loading: false,
      },
    },
    children
  )
}

export function useBasePrice() {
  return useContext(BasePriceContext)
}
