"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  delay?: number
  position?: { x: number; y: number } | null
  followMouse?: boolean
}

export function BorderBeam({
  className,
  size = 300,
  duration = 5,
  delay = 0,
  position = null,
  followMouse = true,
}: BorderBeamProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!followMouse) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePosition({ x, y })
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [followMouse])

  const beamPosition = position || mousePosition

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {beamPosition && (
        <div
          className={cn(
            "absolute bg-gradient-to-r from-transparent via-white to-transparent opacity-20 blur-[8px]",
            className,
          )}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            left: beamPosition.x - size / 2,
            top: beamPosition.y - size / 2,
            transform: "translateZ(0)",
            animation: `beam-keyframes ${duration}s infinite linear`,
            animationDelay: `${delay}s`,
          }}
        />
      )}
    </div>
  )
}
