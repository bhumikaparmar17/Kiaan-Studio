import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  RefreshCw,
  Download,
  Copy,
  Check,
  Maximize2,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Clock,
  Coins,
  AlertTriangle,
  X,
  Upload,
  Sliders,
  Split
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'

// Curated inspiration prompts for Image-to-Image restyling
const PROMPT_INSPIRATIONS = [
  'Transform into a futuristic glowing neon cyberpunk gourmet burger with holographic cheese and laser garnish',
  'Commercial luxury smartwatch displayed on dark pedestal with glowing blue neon accents and studio lighting',
  'Re-imagine contemporary villa with cinematic warm interior lighting and glowing dusk landscape at twilight',
  'Transform into an expressive oil painting with visible impasto brushstrokes and rich textured oils',
  'Restyle into a detailed architectural blueprint pencil sketch on vintage drafting paper',
  'Re-imagine as a watercolor fantasy concept artwork with soft color bleeds and dreamy atmosphere'
]

// Image-to-Image AI Models
const IMG2IMG_MODELS = [
  {
    id: 'flux-2-klein-4b',
    name: 'FLUX.2 Klein 4B',
    badge: 'Available for Demo',
    badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    description: 'Rectified flow multimodal model. Excellent structure preservation and prompt adherence.',
    creditCost: 1,
    defaultDenoise: 0.65,
    defaultSteps: 4,
    isAvailable: true
  },
  {
    id: 'z-image-turbo',
    name: 'Z-Image Turbo',
    badge: 'Coming Soon',
    badgeColor: 'bg-neutral-900/90 text-neutral-400 border-neutral-700/60',
    description: 'S3-DiT with strong stylistic transfer and intricate texture remodeling. In active development.',
    creditCost: 1,
    defaultDenoise: 0.75,
    defaultSteps: 8,
    isAvailable: false
  },
  {
    id: 'flux-depth-canny',
    name: 'FLUX Depth',
    badge: 'Coming Soon',
    badgeColor: 'bg-neutral-900/90 text-neutral-400 border-neutral-700/60',
    description: 'Extracts geometric edge maps for precise retexturing without shape distortion. In active development.',
    creditCost: 2,
    defaultDenoise: 0.50,
    defaultSteps: 4,
    isAvailable: false
  }
]

// Output aspect ratio configurations
const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', icon: Square },
  { id: '16:9', label: '16:9 Cinema', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16 Portrait', icon: RectangleVertical },
  { id: '4:3', label: '4:3 Classic', icon: RectangleHorizontal }
]

// Fallback sample comparisons when gallery is initially empty
const SAMPLE_COMPARISONS = [
  {
    id: 'comp-001',
    title: 'Cyberpunk Gourmet Burger',
    prompt: 'Transform into a futuristic glowing neon cyberpunk gourmet burger with holographic cheese and laser garnish',
    beforeImage: '/images/landing/img2img-ref-burger.jpg',
    afterImage: '/images/landing/img2img-result-burger.jpg',
    model: 'FLUX.2 Klein 4B',
    strength: 0.70,
    timestamp: 'Just now'
  },
  {
    id: 'comp-002',
    title: 'Smartwatch Studio Restyling',
    prompt: 'Commercial luxury smartwatch displayed on dark pedestal with glowing blue neon accents and studio lighting',
    beforeImage: '/images/landing/img2img-ref-watch.jpg',
    afterImage: '/images/landing/img2img-result-watch.jpg',
    model: 'Z-Image Turbo',
    strength: 0.65,
    timestamp: '15m ago'
  },
  {
    id: 'comp-003',
    title: 'Twilight Villa Restyling',
    prompt: 'Re-imagine contemporary villa with cinematic warm interior lighting and glowing dusk landscape at twilight',
    beforeImage: '/images/landing/img2img-ref-villa.jpg',
    afterImage: '/images/landing/img2img-result-villa.jpg',
    model: 'FLUX.2 Klein 4B',
    strength: 0.80,
    timestamp: '1h ago'
  }
]

export function ImageToImagePage() {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef(null)

  // Form State
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [showNegative, setShowNegative] = useState(false)
  const [selectedModel, setSelectedModel] = useState(IMG2IMG_MODELS[0].id)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [transformationStrength, setTransformationStrength] = useState(0.65)

  // Generation & Error State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStepText, setGenerationStepText] = useState('')
  const [generationError, setGenerationError] = useState(null)

  // Uploaded Source Reference Image
  const [sourceImage, setSourceImage] = useState({
    name: 'img2img-ref-burger.jpg',
    url: '/images/landing/img2img-ref-burger.jpg',
    size: '1.4 MB'
  })

  // Comparison & Gallery State
  const [sliderPosition, setSliderPosition] = useState(50)
  const [activeResult, setActiveResult] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  // Modal & Notification State
  const [activeModalItem, setActiveModalItem] = useState(null)
  const [copiedNotification, setCopiedNotification] = useState(false)

  // References for Master-Follower Equal Height Synchronization (matching Text-to-Image)
  const canvasCardRef = useRef(null)
  const promptCardRef = useRef(null)
  const promptTopRef = useRef(null)
  const promptBottomRef = useRef(null)
  const presetsHeaderRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  const [canvasHeight, setCanvasHeight] = useState(() => {
    return 370 + 96
  })
  const [visiblePresetsCount, setVisiblePresetsCount] = useState(4)

  const currentModelObj = IMG2IMG_MODELS.find((m) => m.id === selectedModel) || IMG2IMG_MODELS[0]

  // Dynamic Inspiration Presets Fitting Height Follower Space (matching Text-to-Image)
  const updatePresetsCount = useCallback(() => {
    if (typeof window === 'undefined') return

    if (window.innerWidth < 1024) {
      setVisiblePresetsCount((prev) => (prev !== 2 ? 2 : prev))
      return
    }

    const currentCanvasHeight = canvasCardRef.current?.clientHeight || canvasHeight
    if (!currentCanvasHeight) return

    const topHeight = promptTopRef.current ? promptTopRef.current.offsetHeight : 140
    const bottomHeight = promptBottomRef.current ? promptBottomRef.current.offsetHeight : 28
    const headerHeight = presetsHeaderRef.current ? presetsHeaderRef.current.offsetHeight + 6 : 24
    const cardPadding = 48
    const safetyBuffer = 12

    const usableHeight = currentCanvasHeight - topHeight - bottomHeight - headerHeight - cardPadding - safetyBuffer
    const itemHeight = 38 // 32px item height + 6px gap
    const count = Math.max(1, Math.min(PROMPT_INSPIRATIONS.length, Math.floor(usableHeight / itemHeight)))
    setVisiblePresetsCount(count)
  }, [canvasHeight])

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (canvasCardRef.current) {
        setCanvasHeight(canvasCardRef.current.clientHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (canvasCardRef.current) {
      setCanvasHeight(canvasCardRef.current.clientHeight)
    }
  }, [activeResult])

  useEffect(() => {
    updatePresetsCount()
  }, [canvasHeight, updatePresetsCount])

  // Fetch logged-in user's recent Image-to-Image generations
  const fetchRecentTransformations = useCallback(async () => {
    try {
      setLoadingRecent(true)
      const res = await api.get('/assets/generations', {
        params: { type: 'image', generationType: 'IMAGE_TO_IMAGE', sort: 'newest', limit: 12 }
      })
      const rawList = res.data?.data || []
      const imageItems = rawList
        .filter((item) => {
          if (item.deletedAt) return false
          const isImage = item.type === 'image' || item.mediaType === 'IMAGE'
          const isImg2Img =
            item.generationType === 'IMAGE_TO_IMAGE' ||
            item.jobType === 'IMAGE_TO_IMAGE' ||
            item.tool === 'Image-to-Image'
          return isImage && isImg2Img
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((item) => {
          const rawSrc = item.src || item.storagePath || ''
          const afterImage =
            rawSrc.startsWith('http') || rawSrc.startsWith('data:')
              ? rawSrc
              : rawSrc.startsWith('/')
              ? rawSrc
              : `/${rawSrc}`

          // Distinct original reference image: strictly never fall back to afterImage
          const rawRef = item.referenceImage || null
          let beforeImage = null
          if (rawRef && typeof rawRef === 'string') {
            beforeImage =
              rawRef.startsWith('http') || rawRef.startsWith('data:')
                ? rawRef
                : rawRef.startsWith('/')
                ? rawRef
                : `/${rawRef}`
          }

          return {
            id: item.id,
            title: item.title || item.prompt?.slice(0, 30) || 'Image-to-Image Transformation',
            prompt: item.prompt || '',
            model: item.model || 'FLUX.2 Klein 4B',
            strength: item.cfg ? Number((item.cfg / 10).toFixed(2)) : 0.65,
            dimensions: item.dimensions || '1024×1024',
            seed: item.seed ? String(item.seed) : '482910385',
            steps: item.steps || 4,
            timestamp: formatDateTime(item.createdAt),
            beforeImage: beforeImage,
            afterImage: afterImage
          }
        })

      setHistoryList(imageItems)
      if (imageItems.length > 0) {
        setActiveResult(imageItems[0])
      } else {
        setActiveResult(SAMPLE_COMPARISONS[0])
      }
    } catch (err) {
      console.error('Failed to load recent transformations:', err)
      setHistoryList([])
      setActiveResult(SAMPLE_COMPARISONS[0])
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentTransformations()
  }, [fetchRecentTransformations])

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Handle uploaded source reference image
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const newUrl = reader.result
        setSourceImage({
          name: file.name,
          url: newUrl,
          size: (file.size / 1024).toFixed(1) + ' KB'
        })
        // Immediately update comparison viewer with the newly uploaded original source image
        setActiveResult((prev) =>
          prev
            ? {
                ...prev,
                beforeImage: newUrl
              }
            : null
        )
      }
      reader.readAsDataURL(file)
    }
  }

  // Apply inspiration preset
  const handleApplyInspiration = (presetText) => {
    setPrompt(presetText)
    setGenerationError(null)
  }

  // Enhance prompt with descriptive stylistic keywords
  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      setPrompt(
        'Transform into a photorealistic cinematic restyling, dramatic volumetric lighting, highly detailed textures, masterwork quality, 8k resolution'
      )
    } else {
      setPrompt(
        (prev) => `${prev.trim()}, photorealistic cinematic restyling, dramatic lighting, highly detailed textures, 8k studio quality`
      )
    }
  }

  // Copy prompt to clipboard
  const handleCopyPrompt = (text) => {
    navigator.clipboard?.writeText(text)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2000)
  }

  // Handle Generation
  const handleGenerate = async () => {
    // 1. Prevent duplicate submissions
    if (isGenerating) return

    // 2. Validate source image
    if (!sourceImage || !sourceImage.url) {
      setGenerationError({
        isFlagged: false,
        message: 'Please upload or select a reference image first.',
        suggestion: 'Upload a PNG, JPG, or WebP source image using the upload bar above the prompt.'
      })
      return
    }

    // 3. Validate prompt
    if (!prompt || !prompt.trim()) {
      setGenerationError({
        isFlagged: false,
        message: 'Please enter a transformation prompt describing the desired edits.',
        suggestion: 'Describe how the reference image should be transformed or restyled.'
      })
      return
    }

    // 4. Validate model selection
    const selectedModelObj = IMG2IMG_MODELS.find((m) => m.id === selectedModel)
    if (!selectedModelObj?.isAvailable || selectedModel !== 'flux-2-klein-4b') {
      setGenerationError({
        isFlagged: false,
        message: `The selected model "${currentModelObj.name}" is coming soon and not available for the demo.`,
        suggestion: 'Please select "FLUX.2 Klein 4B", which is available for live demo inference.'
      })
      return
    }

    setGenerationError(null)
    setIsGenerating(true)
    setGenerationProgress(15)
    setGenerationStepText('Submitting Image-to-Image transformation job...')

    try {
      const payload = {
        type: 'IMAGE_TO_IMAGE',
        modelId: 'flux-2-klein-4b',
        prompt: prompt.trim(),
        negativePrompt: showNegative && negativePrompt ? negativePrompt.trim() : undefined,
        parameters: {
          referenceImage: sourceImage.url,
          strength: transformationStrength,
          aspect: aspectRatio || '1:1'
        }
      }

      const res = await api.post('/generation/jobs', payload)
      const jobData = res.data?.data
      if (!jobData || !jobData.id) {
        throw new Error('Invalid response from generation server')
      }

      setGenerationProgress(30)
      setGenerationStepText('Job enqueued. Connecting to Cloudflare Workers AI...')

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      const jobId = jobData.id
      let pollCount = 0
      let consecutiveErrors = 0
      const MAX_POLLS = 60 // ~72 seconds timeout
      const MAX_CONSECUTIVE_ERRORS = 5

      pollIntervalRef.current = setInterval(async () => {
        pollCount++

        if (pollCount > MAX_POLLS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setIsGenerating(false)
          setGenerationProgress(0)
          setGenerationStepText('')
          setGenerationError({
            isFlagged: false,
            message: 'Transformation request timed out.',
            suggestion: 'If credits were deducted, they will be automatically restored by the system queue watchdog.'
          })
          return
        }

        try {
          const pollRes = await api.get(`/generation/jobs/${jobId}`)
          consecutiveErrors = 0
          const updatedJob = pollRes.data?.data
          if (!updatedJob) return

          if (updatedJob.status === 'PROCESSING') {
            setGenerationProgress((prev) => Math.min(85, Math.max(prev, 30 + pollCount * 3)))
            setGenerationStepText('Synthesizing neural transformation on Cloudflare GPU...')
          } else if (updatedJob.status === 'COMPLETED') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setGenerationProgress(100)
            setGenerationStepText('Transformation complete!')

            const primaryAsset = updatedJob.assets?.[0]
            const afterSrc = primaryAsset?.storagePath || primaryAsset?.src || ''
            const formattedAfter =
              afterSrc.startsWith('http') || afterSrc.startsWith('data:')
                ? afterSrc
                : afterSrc.startsWith('/')
                ? afterSrc
                : `/${afterSrc}`

            // Strictly preserve the exact original uploaded reference image
            const refSrc = updatedJob.parameters?.referenceImage || sourceImage?.url || null
            const formattedBefore = refSrc
              ? refSrc.startsWith('http') || refSrc.startsWith('data:')
                ? refSrc
                : refSrc.startsWith('/')
                ? refSrc
                : `/${refSrc}`
              : null

            const newTransformation = {
              id: updatedJob.id,
              title: prompt.trim().slice(0, 32) || 'Transformed Image',
              prompt: prompt.trim(),
              model: 'FLUX.2 Klein 4B',
              strength: transformationStrength,
              dimensions: updatedJob.parameters?.referenceDimensions || '1024×1024',
              seed: updatedJob.parameters?.seed ? String(updatedJob.parameters.seed) : '482910385',
              steps: 4,
              timestamp: 'Just now',
              beforeImage: formattedBefore,
              afterImage: formattedAfter
            }

            setActiveResult(newTransformation)
            setHistoryList((prev) => [newTransformation, ...prev.filter((item) => item.id !== updatedJob.id)])
            setIsGenerating(false)

            // Sync user credit balance
            try {
              const balRes = await api.get('/credits/balance')
              if (balRes.data?.data && setUser) {
                setUser((prev) => (prev ? { ...prev, creditBalance: balRes.data.data.balance } : prev))
              }
            } catch {}
          } else if (updatedJob.status === 'FAILED' || updatedJob.status === 'CANCELED') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsGenerating(false)
            setGenerationProgress(0)
            setGenerationStepText('')

            const errDetail =
              typeof updatedJob.errorMessage === 'string'
                ? updatedJob.errorMessage
                : updatedJob.errorMessage?.message || JSON.stringify(updatedJob.errorMessage || 'Generation failed')

            const isFlagged = /flagged|content moderation|safety/i.test(errDetail)
            setGenerationError({
              isFlagged,
              message: errDetail,
              suggestion: isFlagged
                ? 'Try describing the transformation with different keywords, avoiding sensitive terms.'
                : 'Check your source image and parameters, then try again.'
            })

            // Sync credit balance after refund
            try {
              const balRes = await api.get('/credits/balance')
              if (balRes.data?.data && setUser) {
                setUser((prev) => (prev ? { ...prev, creditBalance: balRes.data.data.balance } : prev))
              }
            } catch {}
          }
        } catch (pollErr) {
          consecutiveErrors++
          console.error(`[Img2Img Polling Error ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}]:`, pollErr)

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsGenerating(false)
            setGenerationProgress(0)
            setGenerationStepText('')
            setGenerationError({
              isFlagged: false,
              message: 'Lost connection to generation server while checking job progress.',
              suggestion: 'Please refresh the page and verify your internet connection.'
            })
          }
        }
      }, 1200)
    } catch (err) {
      setIsGenerating(false)
      setGenerationProgress(0)
      setGenerationStepText('')
      const errorObj = err.response?.data?.error
      const errorMsg =
        typeof errorObj === 'string' ? errorObj : errorObj?.message || err.message || 'Failed to submit generation job'

      setGenerationError({
        isFlagged: /flagged|safety/i.test(errorMsg),
        message: errorMsg,
        suggestion: 'Please verify your source image, prompt, and account balance.'
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* 1. TOP HEADER (Exact replication of Text-to-Image header card) */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Creation Studio
            </span>
            <span className="text-xs text-neutral-500 font-medium">/</span>
            <span className="text-xs text-neutral-400 font-medium truncate">Image-to-Image Interactive Demo</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            Image-to-Image Studio
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Transform, restyle, and remix source imagery while controlling compositional fidelity with denoising strength.
          </p>
        </div>

        {/* Quick balance display & badge */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#080B14] border border-neutral-800 text-left">
            <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              Available Credits
            </div>
            <div className="text-base font-bold text-white">
              {user?.creditBalance ?? 250} <span className="text-xs font-normal text-neutral-400">cr</span>
            </div>
          </div>
          <div className="hidden sm:block px-3 py-2 rounded-xl bg-[#080B14] border border-neutral-800 text-xs text-neutral-400">
            Cost per image: <strong className="text-white font-semibold">{currentModelObj.creditCost} credit</strong>
          </div>
        </div>
      </div>

      {/* 2. FIRST ROW — TWO EQUAL COLUMNS: Prompt Card (Left) + Before/After Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:items-start items-start">
        {/* LEFT COLUMN: Transformation Prompt Card (Follower: matches Canvas height exactly) */}
        <div
          ref={promptCardRef}
          style={{ height: isDesktop && canvasHeight ? `${canvasHeight}px` : undefined }}
          className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 min-h-0 overflow-hidden"
        >
          {/* Top Section */}
          <div ref={promptTopRef} className="space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-input" className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-cyan-400" />
                Transformation Prompt
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 px-2.5 py-1 rounded-lg border border-cyan-800/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Enhance Prompt
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {/* Compact Reference Image Upload Bar (Directly ABOVE prompt textarea) */}
            {sourceImage ? (
              <div className="flex items-center justify-between gap-3 p-1.5 sm:p-2 px-2.5 sm:px-3 rounded-xl bg-[#080B14] border border-neutral-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-700 shrink-0 bg-neutral-900 flex items-center justify-center">
                    <img
                      src={sourceImage.url}
                      alt="Source reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-[210px]">
                      {sourceImage.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                      {sourceImage.size}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-3 h-3 text-cyan-400" />
                  Replace Image
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-[#080B14] border border-dashed border-neutral-700/80">
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-neutral-300 text-xs">No reference image selected</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-1 rounded-lg border border-cyan-800/60 transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Upload Reference Image
                </button>
              </div>
            )}

            {/* Error / Moderation Notice Banner */}
            {generationError && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                  generationError.isFlagged
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    generationError.isFlagged ? 'text-amber-400' : 'text-rose-400'
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {generationError.isFlagged ? 'AI Output Moderation Notice' : 'Generation Error'}
                  </div>
                  <p className="leading-relaxed opacity-90">
                    {typeof generationError.message === 'string'
                      ? generationError.message
                      : generationError.message?.message || JSON.stringify(generationError.message)}
                  </p>
                  {generationError.suggestion && (
                    <p className="text-[11px] text-amber-300 font-medium pt-1">
                      💡 <strong>Suggestion:</strong> {generationError.suggestion}
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-400 font-medium pt-0.5">
                    ✓ Your reserved credits have been fully restored to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerationError(null)}
                  className="p-1 hover:bg-neutral-800/80 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                id="prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how to transform the source image in rich sensory detail (subject, environment, lighting, shot angle, aesthetic mood)..."
                className="w-full rounded-xl p-3 text-sm bg-[#080B14] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:bg-[#0A0E17] focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all resize-none"
              />
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="absolute bottom-2.5 right-2.5 text-xs text-neutral-400 hover:text-white bg-neutral-800/90 px-2 py-0.5 rounded border border-neutral-700 shadow-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Middle Section: Dynamic Inspiration Presets */}
          <div className="flex-1 min-h-0 flex flex-col justify-start py-2 overflow-hidden">
            <div
              ref={presetsHeaderRef}
              className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 shrink-0 mb-1.5"
            >
              Inspiration Presets (Click to Load)
            </div>

            <div className="flex flex-col gap-1.5 overflow-hidden">
              {PROMPT_INSPIRATIONS.slice(0, visiblePresetsCount).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyInspiration(preset)}
                  className="text-left text-xs bg-[#080B14] hover:bg-cyan-950/40 text-neutral-300 hover:text-cyan-200 hover:border-cyan-700/60 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all truncate w-full cursor-pointer h-[32px] shrink-0"
                  title={preset}
                >
                  💡 {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Section: Toggle Negative Prompt */}
          <div ref={promptBottomRef} className="pt-2 border-t border-neutral-800/80 shrink-0">
            <button
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showNegative ? 'Hide Negative Prompt' : 'Add Negative Prompt (Avoid specific elements)'}
            </button>

            {showNegative && (
              <div className="mt-2">
                <textarea
                  rows={2}
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="e.g. blur, out of focus, distorted anatomy, low quality, oversaturated, watermark, extra limbs..."
                  className="w-full rounded-xl p-2.5 text-xs bg-[#080B14] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:bg-[#0A0E17] focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Before/After Comparison Canvas (Master Height Driver matching Real-Time Canvas) */}
        <div
          ref={canvasCardRef}
          className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Split className="w-4 h-4 text-cyan-400" />
              Real-Time Canvas
            </h2>
            {isGenerating ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800/60 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                Transforming...
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-800 px-2.5 py-0.5 rounded border border-neutral-700/60">
                Interactive Comparison
              </span>
            )}
          </div>

          {/* Canvas Display with aspect-square dimensions matching Text-to-Image */}
          <div
            className={cn(
              'relative w-full rounded-xl overflow-hidden bg-[#080B14] border border-neutral-800 flex items-center justify-center transition-all duration-300 mx-auto my-auto aspect-square h-[370px] max-w-full select-none'
            )}
          >
            {isGenerating ? (
              /* Real-time transformation progress overlay */
              <div className="absolute inset-0 bg-[#080B14]/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center text-white space-y-3 z-40">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">Transforming Visual Asset</p>
                  <p className="text-xs text-neutral-400 mt-0.5 max-w-xs">{generationStepText}</p>
                </div>
                <div className="w-44 bg-neutral-800 rounded-full h-1.5 overflow-hidden border border-neutral-700">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-cyan-400">{generationProgress}% completed</span>
              </div>
            ) : activeResult ? (
              /* Interactive Before/After Split Comparison Slider */
              <>
                {/* AFTER Image: Full background */}
                <img
                  src={activeResult.afterImage}
                  alt="After Transformation"
                  className="absolute inset-0 w-full h-full object-cover select-none"
                />
                <div className="absolute top-3 right-3 z-10 text-[10px] font-bold bg-cyan-500/90 text-neutral-950 px-2 py-0.5 rounded shadow pointer-events-none">
                  AFTER
                </div>

                {/* BEFORE Image: Layered on top, clipped horizontally by sliderPosition */}
                {activeResult.beforeImage ? (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={activeResult.beforeImage}
                      alt="Before Transformation"
                      className="absolute inset-0 w-full h-full object-cover select-none"
                    />
                    <div className="absolute top-3 left-3 z-10 text-[10px] font-bold bg-neutral-900/90 text-white px-2 py-0.5 rounded shadow">
                      BEFORE
                    </div>
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none bg-neutral-950/85 backdrop-blur-xs flex items-center justify-start p-4"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div className="max-w-[180px] p-2.5 rounded-xl bg-[#080B14]/95 border border-neutral-800 text-[10px] text-neutral-400 shadow-xl">
                      <span className="font-bold text-amber-400 block mb-0.5">Reference Unavailable</span>
                      Original reference image not preserved.
                    </div>
                    <div className="absolute top-3 left-3 z-10 text-[10px] font-bold bg-neutral-900/90 text-white px-2 py-0.5 rounded shadow">
                      BEFORE
                    </div>
                  </div>
                )}

                {/* Divider Line & Handle */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] flex items-center justify-center cursor-ew-resize z-20 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-400 text-neutral-950 shadow-2xl border border-cyan-300 flex items-center justify-center text-xs font-bold -ml-3.5 select-none">
                    ↔
                  </div>
                </div>

                {/* Invisible Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(parseInt(e.target.value, 10))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
                  title="Drag to compare before and after"
                />
              </>
            ) : (
              /* Canvas Ready default empty state */
              <div className="text-center p-6 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-800/80 flex items-center justify-center text-neutral-400 mx-auto border border-neutral-700/60">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-300">Canvas Ready for Generation</p>
                  <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
                    Upload a reference image above and click Generate to produce your transformation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick action buttons below canvas */}
          {activeResult && !isGenerating && (
            <div className="flex items-center justify-between pt-1 shrink-0">
              <span className="text-xs text-neutral-400">
                Strength: <strong className="font-mono text-cyan-300">{Math.round(activeResult.strength * 100)}%</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(activeResult.prompt)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedNotification ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedNotification ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalItem(activeResult)}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Inspect Details
                </button>
                <a
                  href={activeResult.afterImage}
                  download="kiaan-transformed.jpg"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECOND ROW — TWO EQUAL COLUMNS: AI Inference Model (Left) + Strength & Aspect Ratio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:items-stretch items-start">
        {/* LEFT COLUMN: AI Inference Model Card */}
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 lg:h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              AI Inference Model
            </label>
            <span className="text-[11px] sm:text-xs text-neutral-400">Commercial Multimodal Weights</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {IMG2IMG_MODELS.map((model) => {
              const isSelected = selectedModel === model.id
              const isAvailable = model.isAvailable !== false
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    if (!isAvailable) return
                    setSelectedModel(model.id)
                    setTransformationStrength(model.defaultDenoise)
                  }}
                  className={cn(
                    'h-[108px] sm:h-[112px] p-2 sm:p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-w-0',
                    !isAvailable
                      ? 'opacity-60 border-neutral-800/80 bg-[#080B14]/60 cursor-not-allowed select-none'
                      : isSelected
                      ? 'border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/20 text-white cursor-pointer'
                      : 'border-neutral-800 bg-[#080B14] hover:bg-neutral-800/60 hover:border-neutral-700 text-neutral-300 cursor-pointer'
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'font-bold text-xs leading-tight truncate',
                          isAvailable ? 'text-white' : 'text-neutral-400'
                        )}
                      >
                        {model.name}
                      </span>
                      {!isAvailable && (
                        <span className="text-[9px] text-neutral-500 font-medium px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 shrink-0">
                          Locked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded border leading-none',
                          model.badgeColor
                        )}
                      >
                        {model.badge}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 shrink-0 min-w-0">
                    <span className="truncate">{model.defaultSteps} steps</span>
                    <span className={cn('font-semibold shrink-0 ml-1', isAvailable ? 'text-white' : 'text-neutral-500')}>
                      {isAvailable ? `${model.creditCost} credit` : 'Unavailable'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Transformation Strength & Target Output Aspect Ratio Card */}
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 lg:h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              Transformation Strength & Canvas Aspect
            </label>
            <span className="text-[11px] sm:text-xs font-mono text-cyan-300">
              Denoise: {Math.round(transformationStrength * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {/* Transformation Strength Box */}
            <div className="h-[108px] sm:h-[112px] p-2 sm:p-2.5 rounded-xl border border-neutral-800 bg-[#080B14] flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <span className="text-xs font-bold text-white truncate">Strength (Denoise)</span>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/60 shrink-0 ml-1">
                  {Math.round(transformationStrength * 100)}%
                </span>
              </div>
              <div className="py-1">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={transformationStrength}
                  onChange={(e) => setTransformationStrength(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
              <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[9px] text-neutral-400 shrink-0">
                <span>0.1 (Subtle)</span>
                <span>0.65 (Balanced)</span>
                <span>1.0 (Full Overhaul)</span>
              </div>
            </div>

            {/* Target Output Aspect Ratio Box */}
            <div className="h-[108px] sm:h-[112px] p-2 sm:p-2.5 rounded-xl border border-neutral-800 bg-[#080B14] flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <span className="text-xs font-bold text-white truncate">Target Aspect Ratio</span>
                <span className="text-[10px] font-mono text-neutral-400">{aspectRatio}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 py-0.5">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = aspectRatio === ratio.id
                  const IconComponent = ratio.icon
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={cn(
                        'p-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer h-[44px]',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-500/20'
                          : 'border-neutral-800 bg-[#0D111C] hover:bg-neutral-800 text-neutral-400 hover:text-white'
                      )}
                    >
                      <IconComponent className={cn('w-3 h-3', isSelected ? 'text-cyan-400' : 'text-neutral-500')} />
                      <span className="text-[9px] font-bold leading-none">{ratio.id}</span>
                    </button>
                  )
                })}
              </div>
              <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[9px] text-neutral-400 shrink-0">
                <span>Render Size</span>
                <span className="text-cyan-400 font-mono">1024×1024 px</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GENERATE BUTTON (Centered, matching Text-to-Image exactly) */}
      <div className="flex justify-center w-full py-1">
        <Button
          variant="gradient"
          size="md"
          onClick={handleGenerate}
          isLoading={isGenerating}
          leftIcon={Sparkles}
          className="w-full sm:w-[240px] h-[46px] justify-center font-bold text-sm sm:text-base shadow-xl shadow-indigo-950/40 hover:shadow-indigo-900/60 transition-all cursor-pointer rounded-xl shrink-0"
        >
          {isGenerating ? 'Synthesizing...' : `Generate (${currentModelObj.creditCost} Credit)`}
        </Button>
      </div>

      {/* 5. RECENT GENERATIONS GALLERY (Full-width section below Generate button, matching Text-to-Image) */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Generations
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Click any thumbnail to preview, re-use prompt, or inspect metadata.
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-full">
            {historyList.length}
          </span>
        </div>

        {/* Gallery Grid or Empty State */}
        {loadingRecent && historyList.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs text-neutral-400">Loading recent transformations…</p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="py-10 px-4 rounded-xl border border-dashed border-neutral-800 bg-[#080B14]/60 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-2.5">
              <ImageIcon className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-xs font-semibold text-neutral-200">Your recent transformations will appear here</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
              Transform an image using the prompt bar above to populate your recent studio gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
            {historyList.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveResult(item)}
                className={cn(
                  'group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all flex items-center justify-center p-1',
                  activeResult?.id === item.id
                    ? 'border-cyan-500 bg-cyan-950/20 ring-2 ring-cyan-500/20'
                    : 'border-neutral-800 bg-[#080B14] hover:border-cyan-500 hover:shadow-cyan-500/10'
                )}
              >
                <img
                  src={item.afterImage}
                  alt={item.title || item.prompt}
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {/* Dark gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                  <p className="text-[10px] font-medium line-clamp-1 text-neutral-200">{item.title || item.prompt}</p>
                  <span className="text-[9px] text-cyan-300 font-mono mt-0.5">
                    {Math.round(item.strength * 100)}% denoise • {(item.model || '').split(' ')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. INSPECTION & METADATA MODAL */}
      {activeModalItem && (
        <Modal
          isOpen={!!activeModalItem}
          onClose={() => setActiveModalItem(null)}
          title="Image-to-Image Transformation Details"
          description="Detailed before/after comparison and metadata"
          theme="dark"
          className="max-w-2xl bg-[#0D111C] text-neutral-100 border-neutral-800"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 block mb-1">BEFORE (Source)</span>
                <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#080B14] aspect-square flex items-center justify-center">
                  {activeModalItem.beforeImage ? (
                    <img
                      src={activeModalItem.beforeImage}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      <p className="font-semibold text-amber-400">Reference Unavailable</p>
                      <p className="text-[11px] mt-1 text-neutral-400">Original reference image was not preserved.</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-cyan-400 block mb-1">AFTER (Transformed)</span>
                <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#080B14] aspect-square">
                  <img
                    src={activeModalItem.afterImage}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080B14] border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span>Transformation Prompt</span>
                <button
                  onClick={() => handleCopyPrompt(activeModalItem.prompt)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-normal cursor-pointer"
                >
                  {copiedNotification ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedNotification ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed">
                "{activeModalItem.prompt}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Model</span>
                <span className="font-semibold text-white">{activeModalItem.model}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Transformation Strength</span>
                <span className="font-semibold text-white">{Math.round(activeModalItem.strength * 100)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrompt(activeModalItem.prompt)
                  setTransformationStrength(activeModalItem.strength)
                  setActiveModalItem(null)
                }}
                leftIcon={Wand2}
                className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white cursor-pointer"
              >
                Use this Setup
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModalItem(null)}
                  className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border-neutral-700 cursor-pointer"
                >
                  Close
                </Button>
                <a
                  href={activeModalItem.afterImage}
                  download="kiaan-transformed.jpg"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ImageToImagePage
