"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Play, Pause, SkipBack, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioWaveformProps {
  file?: File
  audioUrl?: string
  compact?: boolean
}

export function AudioWaveform({ file, audioUrl: externalAudioUrl, compact = false }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(externalAudioUrl || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const animationRef = useRef<number>()

  // Create audio URL from file if provided
  useEffect(() => {
    if (!file && !externalAudioUrl) return

    if (file) {
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setIsLoading(true)

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file, externalAudioUrl])

  // Process audio to get waveform data
  useEffect(() => {
    if (!audioUrl) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const audioElement = new Audio()
    audioElement.crossOrigin = "anonymous"
    audioElement.src = audioUrl

    audioElement.addEventListener("loadedmetadata", () => {
      setDuration(audioElement.duration)
    })

    audioElement.addEventListener("canplay", async () => {
      try {
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Get the audio data from the left channel
        const channelData = audioBuffer.getChannelData(0)

        // Reduce the data to a manageable size for visualization
        const sampleSize = Math.floor(channelData.length / 150)
        const samples = []

        for (let i = 0; i < 150; i++) {
          const startIndex = i * sampleSize
          let sum = 0

          // Calculate the average amplitude for this segment
          for (let j = 0; j < sampleSize; j++) {
            sum += Math.abs(channelData[startIndex + j] || 0)
          }

          const average = sum / sampleSize
          samples.push(average)
        }

        // Normalize the data to values between 0 and 1
        const maxSample = Math.max(...samples)
        const normalizedSamples = samples.map((sample) => sample / maxSample)

        setWaveformData(normalizedSamples)
        setIsLoading(false)
      } catch (error) {
        console.error("Error processing audio:", error)
        setIsLoading(false)
      }
    })

    return () => {
      audioElement.pause()
      audioElement.src = ""
    }
  }, [audioUrl])

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw waveform
    const barWidth = rect.width / waveformData.length
    const barGap = compact ? 1 : 2
    const barWidthWithGap = barWidth - barGap
    const centerY = rect.height / 2

    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth
      const height = Math.max(2, amplitude * (rect.height * 0.8))

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, centerY - height / 2, 0, centerY + height / 2)

      // Use different colors for original vs converted
      if (file && !externalAudioUrl) {
        gradient.addColorStop(0, "rgba(148, 163, 184, 0.8)") // Slate for original
        gradient.addColorStop(1, "rgba(100, 116, 139, 0.4)") // Lighter slate
      } else {
        gradient.addColorStop(0, "rgba(52, 211, 153, 0.8)") // Green for converted
        gradient.addColorStop(1, "rgba(16, 185, 129, 0.4)") // Lighter green
      }

      // Draw bar
      ctx.fillStyle = gradient
      ctx.fillRect(x, centerY - height / 2, barWidthWithGap, height)
    })

    // Draw playback position indicator
    if (duration > 0) {
      const playbackPosition = (currentTime / duration) * rect.width
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.fillRect(playbackPosition, 0, 2, rect.height)
    }
  }, [waveformData, currentTime, duration, compact, file, externalAudioUrl])

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    // Set volume
    audio.volume = volume

    // Play/pause based on state
    if (isPlaying) {
      audio.play()
      animationRef.current = requestAnimationFrame(updatePlaybackPosition)
    } else {
      audio.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    // Update playback position for animation
    function updatePlaybackPosition() {
      setCurrentTime(audio.currentTime)
      animationRef.current = requestAnimationFrame(updatePlaybackPosition)
    }

    // Event listeners
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    audio.addEventListener("ended", handleEnded)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      audio.removeEventListener("ended", handleEnded)
    }
  }, [isPlaying, volume])

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return
    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle canvas click for seeking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioRef.current || duration === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const seekPercentage = clickPosition / rect.width
    const seekTime = seekPercentage * duration

    audioRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-3">
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl || undefined} />

      {/* Waveform visualization */}
      <div className={`relative ${compact ? "h-16" : "h-24"} w-full rounded-lg bg-muted/30 p-2`}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="h-full w-full cursor-pointer" onClick={handleCanvasClick} />
        )}
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0
              setCurrentTime(0)
            }
          }}
        >
          <SkipBack className="h-4 w-4" />
          <span className="sr-only">Restart</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
        </Button>

        <div className="flex flex-1 items-center gap-2">
          <span className="min-w-[40px] text-sm">{formatTime(currentTime)}</span>
          <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSeek} className="flex-1" />
          <span className="min-w-[40px] text-sm">{formatTime(duration)}</span>
        </div>

        {!compact && (
          <div className="flex w-32 items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider value={[volume * 100]} max={100} step={1} onValueChange={(value) => setVolume(value[0] / 100)} />
          </div>
        )}
      </div>
    </div>
  )
}
