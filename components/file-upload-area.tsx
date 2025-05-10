"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, FileAudio, AudioWaveformIcon as Waveform } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProcessingSimulation } from "./processing-simulation"
import { AudioWaveform } from "./audio-waveform"

interface FileUploadAreaProps {
  onFileChange: (file: File | null) => void
  onProcessingComplete: () => void
}

export function FileUploadArea({ onFileChange, onProcessingComplete }: FileUploadAreaProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

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
        setFile(droppedFile)
        onFileChange(droppedFile)
        setShowProcessing(false)
      }
    },
    [onFileChange],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        setFile(selectedFile)
        onFileChange(selectedFile)
        setShowProcessing(false)
      }
    },
    [onFileChange],
  )

  const removeFile = useCallback(() => {
    setFile(null)
    onFileChange(null)
    setShowProcessing(false)
  }, [onFileChange])

  const handleProcess = useCallback(() => {
    setShowProcessing(true)
    setProgress(0)
    
    // Simulate progress for testing purposes (remove in production)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onProcessingComplete();
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 200);
  }, [onProcessingComplete])

  return (
    <div className="space-y-6">
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-gradient-to-br from-card to-card/60 hover:border-primary/50 hover:bg-muted/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex w-full max-w-md items-center gap-3 rounded-lg bg-muted/80 p-4 backdrop-blur">
              <div className="rounded-full bg-primary/20 p-2">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 rounded-full" onClick={removeFile}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>

            {/* Audio Waveform Visualization */}
            <div className="mt-2 w-full">
              <AudioWaveform file={file} />
            </div>

            {!showProcessing && (
              <Button className="mt-4 px-8" onClick={handleProcess}>
                Process Audio
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
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
          </div>
        )}
      </div>

      {file && showProcessing && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Waveform className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Processing Audio</h3>
          </div>
          <ProcessingSimulation progress={progress} onComplete={onProcessingComplete} />
        </div>
      )}
    </div>
  )
}