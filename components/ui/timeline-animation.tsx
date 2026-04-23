"use client"

import { motion, Variants, useInView } from "motion/react"
import React, { useRef } from "react"

interface TimelineContentProps {
  children: React.ReactNode
  as?: any
  animationNum?: number
  timelineRef?: React.RefObject<HTMLElement | null>
  customVariants?: Variants
  className?: string
}

export function TimelineContent({
  children,
  as: Component = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
}: TimelineContentProps) {
  const localRef = useRef(null)
  const isInView = useInView(timelineRef || localRef, {
    once: true,
    margin: "-10% 0px",
  })

  const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  }

  const MotionComponent = motion.create(Component)

  return (
    <MotionComponent
      ref={localRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      exit="hidden"
      variants={customVariants || defaultVariants}
      custom={animationNum}
      className={className}
    >
      {children}
    </MotionComponent>
  )
}
