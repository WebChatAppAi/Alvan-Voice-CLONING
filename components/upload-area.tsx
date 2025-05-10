"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, X, FileAudio, AudioWaveformIcon as Waveform, ArrowLeftRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProcessingSimulation } from "./processing-simulation"
import { AudioWaveform } from "./audio-waveform"
import { motion, AnimatePresence } from "framer-motion"
import { BorderBeam } from "@/components/ui/border-beam"

interface UploadAreaProps {
  file: File | null
  onFileChange: (file: File | null) => void
  onStartProcessing: () => void
  onProcessingComplete: () => void
  onReset: () => void
  isProcessing: boolean
  processingComplete: boolean
  convertedAudioUrl: string | null
  progress: number
}

export function UploadArea({
  file,
  onFileChange,
  onStartProcessing,
  onProcessingComplete,
  onReset,
  isProcessing,
  processingComplete,
  convertedAudioUrl,
  progress,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.type.includes("audio")) {
        onFileChange(droppedFile)
      }
    },
    [onFileChange],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        onFileChange(selectedFile)
      }
    },
    [onFileChange],
  )

  // Handle mouse movement for border beam
  useEffect(() => {
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
  }, [])

  // Audio wave animation for empty state
  useEffect(() => {
    if (file || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const waveCount = 20
    const waveWidth = canvas.width / waveCount
    const waveGap = 4
    const waveWidthWithGap = waveWidth - waveGap
    const centerY = canvas.height / 2

    const animationStartTime = Date.now()

    const drawWaves = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const elapsed = Date.now() - animationStartTime

      for (let i = 0; i < waveCount; i++) {
        const x = i * waveWidth

        // Create a wave effect with different phases
        const phase = (i / waveCount) * Math.PI * 2
        const amplitude = Math.sin(elapsed / 1000 + phase) * 0.5 + 0.5
        const height = amplitude * (canvas.height * 0.5)

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, centerY - height, 0, centerY + height)
        gradient.addColorStop(0, "rgba(52, 211, 153, 0.3)") // Green from primary color
        gradient.addColorStop(1, "rgba(16, 185, 129, 0.1)") // Lighter green

        // Draw bar
        ctx.fillStyle = gradient
        ctx.fillRect(x, centerY - height / 2, waveWidthWithGap, height)
      }

      animationRef.current = requestAnimationFrame(drawWaves)
    }

    drawWaves()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [file])

  const handleDownload = () => {
    if (!convertedAudioUrl) return
    
    // Create an anchor element and trigger download
    const a = document.createElement('a')
    a.href = convertedAudioUrl
    a.download = file ? `converted-${file.name}` : 'converted-audio.wav'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[300px] rounded-lg border-2 border-dashed p-6 transition-all ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-gradient-to-br from-card to-card/60 hover:border-primary/50 hover:bg-muted/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Border Beam Effect */}
      <BorderBeam position={mousePosition} size={300} className="from-transparent via-primary/40 to-transparent" />
      <BorderBeam
        position={mousePosition}
        size={200}
        delay={0.5}
        className="from-transparent via-purple-500/30 to-transparent"
      />

      {/* Reset button (shown when file is uploaded) */}
      {file && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
          onClick={onReset}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      )}

      <AnimatePresence mode="wait">
        {/* Initial upload state */}
        {!file && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col items-center justify-center gap-4 text-center"
          >
            <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-6 shadow-inner">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Drag & drop your audio file</h3>
              <p className="mt-1 text-sm text-muted-foreground">Support for WAV, MP3, FLAC, and M4A files up to 50MB</p>
            </div>
            <div className="mt-2">
              <label htmlFor="file-upload">
                <input id="file-upload" type="file" className="sr-only" accept="audio/*" onChange={handleFileChange} />
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>

            {/* Audio wave animation background */}
            <div className="absolute inset-0 z-[-1] flex items-center justify-center opacity-30">
              <canvas ref={canvasRef} className="h-full w-full" />
            </div>
          </motion.div>
        )}

        {/* File uploaded state */}
        {file && !isProcessing && !processingComplete && (
          <motion.div
            key="file-uploaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <div className="flex w-full max-w-md items-center gap-3 rounded-lg bg-muted/80 p-4 backdrop-blur">
              <div className="rounded-full bg-primary/20 p-2">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>

            {/* Audio Waveform Visualization */}
            <div className="mt-2 w-full">
              <AudioWaveform file={file} />
            </div>

            <Button className="mt-4 px-8" onClick={onStartProcessing}>
              Process Audio
            </Button>
          </motion.div>
        )}

        {/* Processing state */}
        {file && isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <div className="mb-4 flex items-center gap-2">
              <Waveform className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Processing Audio</h3>
            </div>
            <ProcessingSimulation onComplete={onProcessingComplete} progress={progress} />
          </motion.div>
        )}

        {/* Comparison state */}
        {file && processingComplete && convertedAudioUrl && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Voice Comparison</h3>
            </div>

            <div className="grid w-full gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Original Audio</h4>
                </div>
                <AudioWaveform file={file} compact />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Waveform className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Converted Audio</h4>
                </div>
                <AudioWaveform audioUrl={convertedAudioUrl} compact />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onReset}>
                Convert Another
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download Result
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}