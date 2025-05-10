/**
 * API client for the RVC Voice Conversion API
 */

// Get the base URL from local storage or use default
export const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("rvc_api_base_url") || "http://localhost:5050"
  }
  return "http://localhost:5050"
}

// Check if API is configured - UPDATED to check for explicitly configured flag
export const isApiConfigured = (): boolean => {
  if (typeof window !== "undefined") {
    // Check for the explicit configuration flag instead of just checking URL value
    return localStorage.getItem("rvc_api_explicitly_configured") === "true"
  }
  return false
}

// Set the base URL in local storage
export const setBaseUrl = (url: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rvc_api_base_url", url)
    // Set flag indicating that API has been explicitly configured
    localStorage.setItem("rvc_api_explicitly_configured", "true")
  }
}

// Validate URL format
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

// API for model management
export const modelsApi = {
  // List all available models
  getModels: async (): Promise<string[]> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      console.log("Fetching models from:", getBaseUrl())
      const response = await fetch(`${getBaseUrl()}/models`, {
        // Add timeout to prevent long hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      
      const data = await response.json()
      console.log("API response data:", data)
      
      // Handle different possible response formats
      if (data.models && Array.isArray(data.models)) {
        console.log("Found models in 'models' property:", data.models)
        return data.models
      } else if (Array.isArray(data)) {
        console.log("Response is already an array:", data)
        return data
      } else if (typeof data === 'object') {
        // Handle case where models might be in another property
        for (const key in data) {
          if (Array.isArray(data[key])) {
            console.log(`Found models in '${key}' property:`, data[key])
            return data[key]
          }
        }
      }
      
      console.error("Unexpected API response format:", data)
      throw new Error("Unexpected API response format")
    } catch (error) {
      console.error("Failed to fetch models:", error)
      throw error
    }
  },

  // Load a specific model
  loadModel: async (modelName: string): Promise<{ status: string; message: string }> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      const response = await fetch(`${getBaseUrl()}/models/${modelName}`, {
        method: "POST",
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error)
      throw error
    }
  },

  // Upload a new model
  uploadModel: async (modelFile: File): Promise<{ status: string; message: string }> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      const formData = new FormData()
      formData.append("model", modelFile)

      const response = await fetch(`${getBaseUrl()}/upload_model`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(120000) // 2 minute timeout for uploads
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error("Failed to upload model:", error)
      throw error
    }
  },
}

// Parameter types based on API documentation
export interface RvcParameters {
  f0method: "harvest" | "crepe" | "rmvpe" | "pm"
  f0up_key: number
  index_rate: number
  filter_radius: number
  resample_sr: number
  rms_mix_rate: number
  protect: number
}

// Default parameters
export const defaultParameters: RvcParameters = {
  f0method: "rmvpe",
  f0up_key: 0,
  index_rate: 0.5,
  filter_radius: 3,
  resample_sr: 0,
  rms_mix_rate: 0.25,
  protect: 0.33,
}

// API for parameter management
export const parametersApi = {
  // Get current parameters
  getParameters: async (): Promise<RvcParameters> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      const response = await fetch(`${getBaseUrl()}/params`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error("Failed to fetch parameters:", error)
      throw error
    }
  },

  // Update parameters
  setParameters: async (params: RvcParameters): Promise<{ status: string; message: string }> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      const response = await fetch(`${getBaseUrl()}/params`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ params }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error("Failed to update parameters:", error)
      throw error
    }
  },
}

// API for audio conversion
export const conversionApi = {
  // Convert audio using the currently loaded model
  convertAudio: async (audioData: string): Promise<Blob> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      const response = await fetch(`${getBaseUrl()}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio_data: audioData }),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return await response.blob()
    } catch (error) {
      console.error("Failed to convert audio:", error)
      throw error
    }
  },
}

// API for system configuration
export const systemApi = {
  // Set computation device
  setDevice: async (device: string): Promise<{ status: string; message: string }> => {
    try {
      if (!isApiConfigured()) {
        throw new Error("API not configured")
      }
      
      const response = await fetch(`${getBaseUrl()}/set_device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      console.error("Failed to set device:", error)
      throw error
    }
  },
}