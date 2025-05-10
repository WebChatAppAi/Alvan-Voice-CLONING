"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModelSelection } from "@/components/model-selection"
import { AdvancedParameters } from "@/components/advanced-parameters"
import { UploadArea } from "@/components/upload-area"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { conversionApi, isApiConfigured, parametersApi, defaultParameters } from "@/lib/api-client"
import { toast } from "sonner"

export function VoiceCloning() {
  const [file, setFile] = useState<File | null>(null)
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleStartProcessing = async () => {
    if (!file) return

    // Check if API is configured
    if (!isApiConfigured()) {
      toast.error("API not configured. Please set up the API connection in Settings.")
      // Open settings dialog
      document.querySelector('[aria-label="Settings"]')?.dispatchEvent(new MouseEvent('click'))
      return
    }

    try {
      setIsProcessing(true)
      setProcessingComplete(false)
      setProgress(0)
      
      // First, set the parameters (silently, no UI notification)
      try {
        await parametersApi.getParameters()
        .then(currentParams => {
          // Silently update parameters - we don't show toasts for this
          return parametersApi.setParameters(currentParams);
        })
        .catch(error => {
          console.error("Could not set parameters, using defaults:", error);
          // Still continue with the conversion
        });
      } catch (error) {
        console.error("Error setting parameters:", error);
        // Continue with conversion anyway since params might be set on server
      }
      
      // Convert the audio file to base64
      const reader = new FileReader()
      
      // Track upload progress (Phase 1: 0-80%)
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          // Map upload progress to 0-80% of our total progress
          const uploadPercentage = (event.loaded / event.total) * 100;
          const mappedProgress = Math.min(uploadPercentage * 0.8, 80);
          setProgress(mappedProgress);
        }
      }
      
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        try {
          // Phase 2: Start artificial slow progress from 80-90%
          const slowProgressInterval = setInterval(() => {
            setProgress(prevProgress => {
              const newProgress = prevProgress + 0.2;
              return newProgress < 90 ? newProgress : prevProgress;
            });
          }, 100);
          
          // Extract the base64 data (remove the prefix like "data:audio/wav;base64,")
          const base64Data = (reader.result as string).split(',')[1]
          
          // Call the API to convert the audio
          const audioBlob = await conversionApi.convertAudio(base64Data)
          
          // Clear the slow progress interval
          clearInterval(slowProgressInterval);
          
          // Phase 3: Jump to 100% once we have the result
          setProgress(100);
          
          // Create a URL for the converted audio
          const audioUrl = URL.createObjectURL(audioBlob)
          setConvertedAudioUrl(audioUrl)
          setProcessingComplete(true)
          
          // Don't show toast since the UI will naturally transition to the comparison view
        } catch (error) {
          console.error("Error processing audio:", error)
          toast.error("Failed to process audio. Please check API connection and selected model.")
        } finally {
          setIsProcessing(false)
        }
      }
      
      reader.onerror = () => {
        toast.error("Error reading audio file")
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error starting audio processing:", error)
      toast.error("Failed to start audio processing")
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    // Clean up URL objects to prevent memory leaks
    if (convertedAudioUrl) {
      URL.revokeObjectURL(convertedAudioUrl)
    }
    
    setFile(null)
    setConvertedAudioUrl(null)
    setProcessingComplete(false)
    setIsProcessing(false)
    setProgress(0)
  }

  return (
    <div className="grid gap-6">
      {/* Main workflow area */}
      <Card className="relative overflow-hidden">
        <GlowingEffect 
          spread={40} 
          glow={true} 
          disabled={false} 
          proximity={64} 
          inactiveZone={0.01} 
          borderWidth={2} 
          className="z-10"
        />
        <CardHeader className="pb-4 z-20 relative">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Voice Cloning</CardTitle>
          <CardDescription>
            Upload an audio file, select a voice model, and adjust parameters to clone your voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="z-20 relative">
          <div className="relative overflow-hidden rounded-md">
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={50}
              inactiveZone={0.01}
              borderWidth={1.5}
              className="z-10"
            />
            <UploadArea
              file={file}
              onFileChange={setFile}
              onStartProcessing={handleStartProcessing}
              onProcessingComplete={() => {}} // No longer needed, handled in handleStartProcessing
              onReset={handleReset}
              isProcessing={isProcessing}
              processingComplete={processingComplete}
              convertedAudioUrl={convertedAudioUrl}
              progress={progress} // Pass progress to UploadArea
            />
          </div>
        </CardContent>
      </Card>

      {/* Model and parameters section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-visible">
          <Card className="relative overflow-visible shadow-lg">
            <GlowingEffect 
              spread={35} 
              glow={true} 
              disabled={false} 
              proximity={60} 
              inactiveZone={0.01} 
              borderWidth={2} 
              className="z-10"
            />
            <CardHeader className="pb-4 z-20 relative">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/20 p-1">
                  <span className="block h-2 w-2 rounded-full bg-primary"></span>
                </div>
                <CardTitle>Voice Model</CardTitle>
              </div>
              <CardDescription>Select a voice model to use for cloning.</CardDescription>
            </CardHeader>
            <CardContent className="z-20 relative">
              <div className="relative rounded-md">
                <ModelSelection />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-visible">
          <Card className="relative overflow-visible shadow-lg">
            <GlowingEffect 
              spread={35} 
              glow={true} 
              disabled={false} 
              proximity={60} 
              inactiveZone={0.01} 
              borderWidth={2} 
              className="z-10"
            />
            <CardHeader className="pb-4 z-20 relative">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/20 p-1">
                  <span className="block h-2 w-2 rounded-full bg-primary"></span>
                </div>
                <CardTitle>Parameters</CardTitle>
              </div>
              <CardDescription>Adjust advanced parameters to fine-tune your voice clone.</CardDescription>
            </CardHeader>
            <CardContent className="z-20 relative">
              <div className="relative rounded-md">
                <AdvancedParameters />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}