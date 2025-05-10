"use client"

import { useState } from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { parametersApi, defaultParameters, type RvcParameters } from "@/lib/api-client"
import { toast } from "sonner"
import { GlowingEffect } from "@/components/ui/glowing-effect"

export function AdvancedParameters() {
  const [isOpen, setIsOpen] = useState(false)
  const [parameters, setParameters] = useState<RvcParameters>(defaultParameters)
  const [isLoading, setIsLoading] = useState(false)

  const updateParameter = (key: keyof RvcParameters, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleApplyParameters = async () => {
    try {
      setIsLoading(true)
      await parametersApi.setParameters(parameters)
      toast.success("Parameters updated successfully")
    } catch (error) {
      console.error("Failed to update parameters:", error)
      toast.error("Failed to update parameters")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setParameters(defaultParameters)
  }

  // Options for F0 method dropdown
  const f0Methods = [
    { value: "harvest", label: "Harvest (Accurate, Slow)" },
    { value: "crepe", label: "Crepe (Accurate, GPU)" },
    { value: "rmvpe", label: "RMVPE (Balanced)" },
    { value: "pm", label: "PM (Fast, Less Accurate)" },
  ]

  return (
    <div className="relative overflow-visible">
      {/* Advanced Parameters Toggle Button */}
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Advanced Parameters</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </Button>

      {/* Advanced Parameters Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: "auto", 
              opacity: 1,
              transition: {
                height: { 
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1] // Custom ease for smooth animation
                },
                opacity: { 
                  duration: 0.2,
                  delay: 0.1
                }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { 
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1] 
                },
                opacity: { 
                  duration: 0.2 
                }
              }
            }}
            className="overflow-hidden"
            style={{ 
              willChange: "height, opacity",
              position: "relative",
              zIndex: 10 
            }}
          >
            <div className="mt-4 relative">
              {/* Inner container with glow effect */}
              <div className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm">
                {/* Add glowing effect to inner container */}
                <GlowingEffect 
                  spread={30} 
                  glow={true} 
                  disabled={false} 
                  proximity={50} 
                  inactiveZone={0.01} 
                  borderWidth={1.5} 
                  className="z-10"
                />
                
                <div className="relative z-20">
                  <Tabs defaultValue="pitch" className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="pitch" className="flex-1">Pitch</TabsTrigger>
                      <TabsTrigger value="quality" className="flex-1">Quality</TabsTrigger>
                      <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
                    </TabsList>

                    {/* Pitch Tab Content */}
                    <TabsContent value="pitch" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="f0method">Pitch Extraction Method</Label>
                        </div>
                        <Select
                          value={parameters.f0method}
                          onValueChange={(value) => updateParameter("f0method", value as any)}
                        >
                          <SelectTrigger id="f0method" className="w-full">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {f0Methods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Method used to extract pitch information from audio
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="f0up_key">Pitch Shift</Label>
                          <span className="text-sm font-medium">
                            {parameters.f0up_key > 0
                              ? `+${parameters.f0up_key} semitones`
                              : parameters.f0up_key < 0
                              ? `${parameters.f0up_key} semitones`
                              : "No shift"}
                          </span>
                        </div>
                        <Slider
                          id="f0up_key"
                          min={-12}
                          max={12}
                          step={1}
                          value={[parameters.f0up_key]}
                          onValueChange={([value]) => updateParameter("f0up_key", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Adjust the pitch of the output voice in semitones
                        </p>
                      </div>
                    </TabsContent>

                    {/* Quality Tab Content */}
                    <TabsContent value="quality" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="index_rate">Index Rate</Label>
                          <span className="text-sm font-medium">{parameters.index_rate.toFixed(2)}</span>
                        </div>
                        <Slider
                          id="index_rate"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[parameters.index_rate]}
                          onValueChange={([value]) => updateParameter("index_rate", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher values produce more accurate timbres but may introduce artifacts
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="rms_mix_rate">Volume Envelope Mix</Label>
                          <span className="text-sm font-medium">{parameters.rms_mix_rate.toFixed(2)}</span>
                        </div>
                        <Slider
                          id="rms_mix_rate"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[parameters.rms_mix_rate]}
                          onValueChange={([value]) => updateParameter("rms_mix_rate", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          How much of the original volume dynamics to preserve
                        </p>
                      </div>
                    </TabsContent>

                    {/* Advanced Tab Content */}
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="filter_radius">Filter Radius</Label>
                          <span className="text-sm font-medium">{parameters.filter_radius}</span>
                        </div>
                        <Slider
                          id="filter_radius"
                          min={0}
                          max={7}
                          step={1}
                          value={[parameters.filter_radius]}
                          onValueChange={([value]) => updateParameter("filter_radius", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Smoothing filter for pitch tracking (higher = smoother)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="resample_sr">Output Sample Rate</Label>
                          <span className="text-sm font-medium">
                            {parameters.resample_sr === 0 ? "Original" : `${parameters.resample_sr.toLocaleString()} Hz`}
                          </span>
                        </div>
                        <Slider
                          id="resample_sr"
                          min={0}
                          max={48000}
                          step={1000}
                          value={[parameters.resample_sr]}
                          onValueChange={([value]) => updateParameter("resample_sr", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Output sample rate (0 = same as input)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="protect">Protection Strength</Label>
                          <span className="text-sm font-medium">{parameters.protect.toFixed(2)}</span>
                        </div>
                        <Slider
                          id="protect"
                          min={0}
                          max={0.5}
                          step={0.01}
                          value={[parameters.protect]}
                          onValueChange={([value]) => updateParameter("protect", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Protection for unvoiced consonants and breath sounds
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      onClick={handleApplyParameters}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Applying..." : "Apply Parameters"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}