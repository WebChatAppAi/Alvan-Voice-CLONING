"use client"

import { useEffect, useState } from "react"
import { Check, Star, HardDrive, Upload, Mic, AlertCircle, Settings } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Button } from "@/components/ui/button"
import { modelsApi, getBaseUrl, isApiConfigured } from "@/lib/api-client"
import { toast } from "sonner"

// Define a model interface
interface Model {
  id: string;
  name: string;
  description: string;
  featured: boolean;
  icon: any;
  color: string;
}

// Non-model entries to filter out
const NON_MODEL_ENTRIES = ["set_device"];

export function ModelSelection() {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingModel, setIsLoadingModel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch models when component mounts
  useEffect(() => {
    fetchModels()
  }, [])

  // Listen for settings updates to re-fetch models
  useEffect(() => {
    const handleSettingsUpdate = () => {
      console.log("Settings updated event received, fetching models...");
      fetchModels();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []); // Empty dependency array, sets up listener once

  const fetchModels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if API URL is configured (using isApiConfigured for consistency)
      if (!isApiConfigured()) {
        console.log("API not configured, skipping model fetch.");
        setError("API not configured. Please set up the API connection in Settings.")
        setModels([]) // Clear existing models if API becomes unconfigured
        setSelectedModel(null)
        setIsLoading(false)
        return
      }
      
      console.log("Fetching models using modelsApi.getModels...");
      const modelNames = await modelsApi.getModels() // Use modelsApi
      console.log("Models API response (via modelsApi):", modelNames)
        
      if (modelNames.length === 0) {
        setModels([])
        setSelectedModel(null)
        // setError("No models found on the server.") // Optional: specific message for no models
        setIsLoading(false)
        return
      }
      
      // Filter out any non-model entries like "set_device"
      const filteredModelNames = modelNames.filter(name => 
        !NON_MODEL_ENTRIES.includes(name)
      );
      
      console.log("Filtered model names:", filteredModelNames);
      
      // Convert model names to our model interface
      const formattedModels = filteredModelNames.map((name, index) => ({
        id: name,
        name: formatModelName(name),
        description: `RVC voice model (${name})`,
        featured: index === 0, // Mark first model as featured
        icon: HardDrive,
        color: getModelColor(index),
      }))
      
      setModels(formattedModels)
      
      // Select the first model by default if we have models and none is selected,
      // or if the currently selected model is no longer in the list.
      if (formattedModels.length > 0) {
        const currentSelectedModelStillExists = formattedModels.some(m => m.id === selectedModel);
        if (!selectedModel || !currentSelectedModelStillExists) {
          setSelectedModel(formattedModels[0].id);
        }
      } else {
        setSelectedModel(null); // No models, so no selection
      }

    } catch (error: any) { // Catch block for the main try
      console.error("Failed to fetch models:", error)
      // Check if the error is due to API not configured (e.g., if isApiConfigured was true but getBaseUrl() was default)
      // This case should ideally be caught by the isApiConfigured() check earlier.
      if (error.message && error.message.includes("API not configured")) {
        setError("API not configured. Please set up the API connection in Settings.")
      } else {
        setError("Unable to connect to the API or fetch models. Please check your API configuration and server status.")
      }
      setModels([]) // Clear models on error
      setSelectedModel(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Format model name for display
  const formatModelName = (name: string): string => {
    if (!name) return "Unknown Model"
    
    // Remove file extensions
    const withoutExtension = name.replace(/\.(pth|pt|bin)$/, "")
    
    // Convert snake_case or kebab-case to Title Case
    return withoutExtension
      .replace(/[-_]/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get a color for the model based on index
  const getModelColor = (index: number): string => {
    const colors = [
      "from-emerald-500 to-green-600",
      "from-purple-500 to-violet-600",
      "from-blue-500 to-cyan-600",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
    ]
    
    return colors[index % colors.length]
  }

  // Load the selected model
  const handleLoadModel = async () => {
    if (!selectedModel) return
    
    try {
      setIsLoadingModel(true)
      console.log("Loading model:", selectedModel)
      
      const response = await fetch(`${getBaseUrl()}/models/${selectedModel}`, {
        method: "POST",
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log("Load model response:", result)
      
      toast.success(result.message || "Model loaded successfully")
    } catch (error) {
      console.error("Failed to load model:", error)
      toast.error("Failed to load model")
    } finally {
      setIsLoadingModel(false)
    }
  }

  // Refresh the model list
  const handleRefresh = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const baseUrl = getBaseUrl()
      console.log("Testing connection to:", baseUrl)
      
      // First, try to check if the API is actually accessible
      const response = await fetch(`${baseUrl}/models`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (response.ok) {
        // If connection is successful, mark API as explicitly configured
        if (typeof window !== "undefined") {
          localStorage.setItem("rvc_api_explicitly_configured", "true")
          // Also save the current URL to ensure consistency
          localStorage.setItem("rvc_api_base_url", baseUrl)
          console.log("API connection successful, marked as configured")
        }
        
        // Now that API is marked as configured, fetch models will work
        fetchModels()
        
        // Optionally show toast for successful connection
        toast.success("Connection established successfully")
      } else {
        console.error(`API connection failed: ${response.status} ${response.statusText}`)
        setError("Unable to connect to the API. Please check your settings and server status.")
        setModels([])
        setSelectedModel(null)
        setIsLoading(false)
        toast.error("Connection failed. Please check your API settings.")
      }
    } catch (error) {
      console.error("Connection test failed:", error)
      setError("Unable to connect to the API. Please check your settings and server status.")
      setModels([])
      setSelectedModel(null)
      setIsLoading(false)
      toast.error("Connection failed. Please check your API settings.")
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="animate-pulse rounded-full bg-primary/10 p-3">
          <Mic className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Loading voice models...</h3>
        <p className="mt-2 text-sm text-muted-foreground">Fetching available models from the RVC API</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mt-4 text-lg font-medium">API Connection Required</h3>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button 
            onClick={() => document.querySelector('[aria-label="Settings"]')?.dispatchEvent(new MouseEvent('click'))} 
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Open Settings
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  // Render empty state
  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No Voice Models Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload voice models to your RVC API server to get started
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          Refresh Models
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedModel || ""} onValueChange={setSelectedModel} className="grid gap-3">
        {models.map((model) => {
          const isSelected = selectedModel === model.id

          return (
            <div
              key={model.id}
              className={`relative flex cursor-pointer rounded-lg border transition-all overflow-hidden ${
                isSelected
                  ? "border-primary bg-gradient-to-r bg-opacity-10 shadow-md"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
              } ${isSelected ? model.color : ""}`}
              onClick={() => setSelectedModel(model.id)}
            >
              <GlowingEffect
                spread={30}
                glow={isSelected}
                disabled={false}
                proximity={50}
                inactiveZone={0.01}
                borderWidth={1.5}
              />
              <RadioGroupItem value={model.id} id={model.id} className="sr-only" />
              <div className="flex flex-1 items-start gap-4 p-4">
                <div
                  className={`rounded-full p-2 ${isSelected ? "bg-white/20" : `bg-gradient-to-br ${model.color} bg-opacity-10`}`}
                >
                  <model.icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-primary"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={model.id}
                      className={`text-base font-medium cursor-pointer ${isSelected ? "text-white" : ""}`}
                    >
                      {model.name}
                    </Label>
                    {model.featured && (
                      <Badge
                        variant={isSelected ? "outline" : "secondary"}
                        className={`flex items-center gap-1 ${isSelected ? "border-white/40 text-white" : ""}`}
                      >
                        <Star className="h-3 w-3 fill-current" />
                        <span>Recommended</span>
                      </Badge>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                    {model.description}
                  </p>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    isSelected ? "border border-white/40 bg-white/20 text-white" : "border border-muted-foreground"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </div>
            </div>
          )
        })}
      </RadioGroup>

      <div className="flex gap-2">
        <Button
          onClick={handleLoadModel}
          disabled={!selectedModel || isLoadingModel}
          className="w-full"
        >
          {isLoadingModel ? "Loading..." : "Load Model"}
        </Button>
        <Button onClick={handleRefresh} variant="outline" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M21 12a9 9 0 0 1-9 9c-2.39 0-4.68-.94-6.4-2.6"></path>
            <path d="M3 12a9 9 0 0 1 9-9c2.39 0 4.68.94 6.4 2.6"></path>
            <path d="m22 4-3 3-3-3"></path>
            <path d="m2 20 3-3 3 3"></path>
          </svg>
        </Button>
      </div>
    </div>
  )
}