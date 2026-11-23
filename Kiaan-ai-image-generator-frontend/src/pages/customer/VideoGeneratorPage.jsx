import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Video,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Download,
  Copy,
  Check,
  Clock,
  Coins,
  Layers,
  Wand2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Volume2,
  VolumeX,
  Film,
  RefreshCw,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  AlertTriangle,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'

// Video Generation Models (PRD / sovereign open weights)
const VIDEO_MODELS = [
  {
    id: 'wan-2.1-t2v-1.3b',
    name: 'Wan 2.1 Video (Draft 480p)',
    badge: 'Fast (~35s)',
    badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    description: 'Fast 3D spatio-temporal video synthesis at 854×480. Ideal for rapid shot ideation.',
    creditCost: 12,
    defaultDuration: '5.0s',
    defaultFps: 16
  },
  {
    id: 'wan-2.1-t2v-14b',
    name: 'Wan 2.1 Video (Cinema 720p)',
    badge: 'Cinema 720p (~75s)',
    badgeColor: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
    description: 'High-definition 1280×720 cinematic video generation with fluid 3D DiT dynamic camera motion.',
    creditCost: 25,
    defaultDuration: '5.0s',
    defaultFps: 24
  },
  {
    id: 'ltx-video-0.9',
    name: 'LTX-Video 0.9.1 (Spatial)',
    badge: 'Ultra Motion',
    badgeColor: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
    description: 'Lightweight spatio-temporal video foundation model for dynamic action sequences.',
    creditCost: 18,
    defaultDuration: '4.0s',
    defaultFps: 24
  }
]

// Video Aspect Ratios
const VIDEO_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 Cinema', width: 1280, height: 720, icon: RectangleHorizontal, desc: 'Cinema & desktop' },
  { id: '9:16', label: '9:16 Portrait', width: 720, height: 1280, icon: RectangleVertical, desc: 'Stories & Reels' },
  { id: '1:1', label: '1:1 Square', width: 1024, height: 1024, icon: Square, desc: 'Social feed & avatar' }
]

// Canvas preview dimensions per aspect ratio (Video Preview Player is master height driver)
const CANVAS_PREVIEW_CONFIG = {
  '16:9': { previewHeight: 280, containerClass: 'aspect-video h-[280px] max-w-full' },
  '9:16': { previewHeight: 440, containerClass: 'aspect-[9/16] h-[440px] max-w-full' },
  '1:1': { previewHeight: 370, containerClass: 'aspect-square h-[370px] max-w-full' }
}

// Prompt Inspirations for Video (8 high-quality cinematic prompts)
const VIDEO_PROMPT_INSPIRATIONS = [
  'Cinematic drone flyover above a secluded tropical island waterfall at sunset, lush jungle mist, golden hour volumetric rays.',
  'Formula race car drifting around a rain-slicked asphalt curve at night, sparks flying, tire smoke reflecting neon stadium lights.',
  'Futuristic cybernetic metropolis street tracking shot, flying hover vehicles cruising between glowing skyscrapers in heavy rain.',
  'Slow-motion macro shot of an espresso drop splashing into a porcelain cup with creamy swirling crema ripples.',
  'High-speed tracking shot of a snowmobile carving through fresh powder on an alpine mountain peak at sunrise.',
  'Slow aerial crane descent towards an ancient lantern-lit temple courtyard in Kyoto amidst cherry blossom petals.',
  'Epic low-angle dolly shot of an astronaut walking across a glowing bioluminescent alien terrain.',
  'Time-lapse celestial aurora borealis dancing across starry Arctic night skies with glowing emerald ribbons.'
]

export function VideoGeneratorPage() {
  const { user, setUser } = useAuth()

  // Form State
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [showNegative, setShowNegative] = useState(false)
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0].id)
  const [duration, setDuration] = useState('5.0s')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('720p')
  const [cameraMotion, setCameraMotion] = useState('pan_right')
  const [motionIntensity, setMotionIntensity] = useState(6)
  const [fps, setFps] = useState(24)
  const [seed, setSeed] = useState('')
  const [isRandomSeed, setIsRandomSeed] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Layout references for Master-Follower equal-height synchronization
  const canvasCardRef = useRef(null)
  const promptCardRef = useRef(null)
  const promptTopRef = useRef(null)
  const promptBottomRef = useRef(null)
  const presetsHeaderRef = useRef(null)

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  const [canvasHeight, setCanvasHeight] = useState(() => {
    return (CANVAS_PREVIEW_CONFIG['16:9']?.previewHeight || 280) + 96
  })
  const [visiblePresetsCount, setVisiblePresetsCount] = useState(2)

  // Generation Simulation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStepText, setGenerationStepText] = useState('')
  const [generationError, setGenerationError] = useState(null)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [videoHistory, setVideoHistory] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  // Video Player Simulation State
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerProgress, setPlayerProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(true)

  // Inspection Modal
  const [activeModalItem, setActiveModalItem] = useState(null)
  const [copiedNotification, setCopiedNotification] = useState(false)

  const currentModelObj = VIDEO_MODELS.find(m => m.id === selectedModel) || VIDEO_MODELS[0]

  // Calculate dynamic presets fitting into available height follower space
  const updatePresetsCount = useCallback(() => {
    if (typeof window === 'undefined') return

    // On narrow/mobile screens, keep preset list compact so cards stack naturally
    if (window.innerWidth < 1024) {
      setVisiblePresetsCount((prev) => (prev !== 2 ? 2 : prev))
      return
    }

    const currentCanvasHeight = canvasCardRef.current?.clientHeight || canvasHeight
    if (!currentCanvasHeight) return

    const topHeight = promptTopRef.current ? promptTopRef.current.offsetHeight : 124
    const bottomHeight = promptBottomRef.current ? promptBottomRef.current.offsetHeight : 28
    const headerHeight = presetsHeaderRef.current ? presetsHeaderRef.current.offsetHeight + 6 : 24
    const cardPadding = 48
    const safetyBuffer = 12

    const usableHeight = currentCanvasHeight - topHeight - bottomHeight - headerHeight - cardPadding - safetyBuffer

    // Each preset button is h-[32px] (32px) + gap-1.5 (6px) = 38px
    // For N items: totalNeeded = 38 * N - 6 => N = Math.floor((usableHeight + 6) / 38)
    const count = Math.max(1, Math.min(VIDEO_PROMPT_INSPIRATIONS.length, Math.floor((usableHeight + 6) / 38)))
    setVisiblePresetsCount((prev) => (prev !== count ? count : prev))
  }, [canvasHeight, showNegative, generationError])

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (!desktop) {
        setVisiblePresetsCount(2)
      } else {
        updatePresetsCount()
      }
    }

    window.addEventListener('resize', handleResize)

    const canvasNode = canvasCardRef.current
    if (!canvasNode || typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver(() => {
      const fullHeight = canvasNode.clientHeight
      if (fullHeight > 0) {
        setCanvasHeight(fullHeight)
      }
      updatePresetsCount()
    })

    observer.observe(canvasNode)

    if (canvasNode.clientHeight > 0) {
      setCanvasHeight(canvasNode.clientHeight)
    }
    updatePresetsCount()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [updatePresetsCount, aspectRatio, currentVideo, isGenerating])

  const handleSelectAspectRatio = (ratioId) => {
    setAspectRatio(ratioId)
    if (window.innerWidth >= 1024) {
      const estimatedHeight =
        (CANVAS_PREVIEW_CONFIG[ratioId]?.previewHeight || 280) +
        (currentVideo && !isGenerating ? 122 : 96)
      setCanvasHeight(estimatedHeight)
    }
  }

  // Fetch logged-in user's recent Text-to-Video generations
  const fetchRecentVideos = useCallback(async () => {
    try {
      setLoadingRecent(true)
      const res = await api.get('/assets/generations', {
        params: { type: 'video', generationType: 'TEXT_TO_VIDEO', sort: 'newest', limit: 12 }
      })
      const rawList = res.data?.data || []
      const videoItems = rawList
        .filter((item) => {
          if (item.deletedAt) return false
          const isVideo = item.type === 'video' || item.mediaType === 'VIDEO'
          const isTextToVideo = item.generationType === 'TEXT_TO_VIDEO' || item.jobType === 'TEXT_TO_VIDEO' || item.tool === 'Text-to-Video'
          return isVideo && isTextToVideo
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((item) => {
          const rawSrc = item.src || item.storagePath || ''
          const videoUrl = rawSrc.startsWith('http') || rawSrc.startsWith('data:')
            ? rawSrc
            : (rawSrc.startsWith('/') ? rawSrc : `/${rawSrc}`)
          const rawThumb = item.poster || item.thumbnailPath || videoUrl
          const thumbUrl = rawThumb.startsWith('http') || rawThumb.startsWith('data:')
            ? rawThumb
            : (rawThumb.startsWith('/') ? rawThumb : `/${rawThumb}`)

          return {
            id: item.id,
            title: item.title || item.prompt?.slice(0, 30) || 'Text-to-Video Sequence',
            prompt: item.prompt || '',
            model: item.model || 'Wan 2.1 Video',
            resolution: item.dimensions || '1280×720',
            duration: item.duration || '5.0s',
            fps: item.fps || 24,
            cameraMotion: item.camera || 'Dynamic',
            seed: item.seed ? String(item.seed) : '8192',
            timestamp: formatDateTime(item.createdAt),
            thumbnail: thumbUrl,
            videoUrl: videoUrl,
            badge: `${item.aspect || '16:9'}`,
            status: 'COMPLETED'
          }
        })
      setVideoHistory(videoItems)
      if (videoItems.length > 0) {
        setCurrentVideo(videoItems[0])
      } else {
        setCurrentVideo(null)
      }
    } catch (err) {
      console.error('Failed to load recent video generations:', err)
      setVideoHistory([])
      setCurrentVideo(null)
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentVideos()
  }, [fetchRecentVideos])

  // Simulate playback loop
  useEffect(() => {
    let interval = null
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayerProgress((prev) => {
          if (prev >= 100) {
            return 0
          }
          return prev + 2.5
        })
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      setPrompt('Epic cinematic crane tracking shot, dramatic lighting, 8k render, photorealistic motion blur, high visual fidelity')
      return
    }
    const enhancements = [
      'cinematic lighting, 8k resolution, smooth 60fps dynamic motion blur, photorealistic depth of field',
      'hyper-detailed cinematic composition, volumetric atmospheric haze, octane render quality, steadycam motion',
      'shot on 35mm anamorphic lens, shallow depth of field, natural fluid dynamics'
    ]
    const chosen = enhancements[Math.floor(Math.random() * enhancements.length)]
    if (!prompt.includes('cinematic') && !prompt.includes('smooth')) {
      setPrompt(`${prompt.trim()}, ${chosen}`)
    }
  }

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || VIDEO_PROMPT_INSPIRATIONS[Math.floor(Math.random() * VIDEO_PROMPT_INSPIRATIONS.length)]
    if (!prompt.trim()) {
      setPrompt(finalPrompt)
    }

    setGenerationError(null)
    setIsGenerating(true)
    setGenerationProgress(10)
    setGenerationStepText('Initializing 3D DiT video inference queue...')

    const randomSeedVal = isRandomSeed ? Math.floor(Math.random() * 900000000 + 100000000).toString() : (seed || '8192')

    try {
      const res = await api.post('/generation/jobs', {
        type: 'TEXT_TO_VIDEO',
        modelId: currentModelObj.id,
        prompt: finalPrompt,
        negativePrompt: negativePrompt.trim() || undefined,
        parameters: {
          duration,
          aspectRatio,
          fps,
          cameraMotion,
          seed: randomSeedVal
        }
      })

      if (res.data?.success && res.data?.data) {
        const backendJob = res.data.data
        const jobId = backendJob.id

        // Synchronize real credit balance from server after reservation
        try {
          const balRes = await api.get('/credits/balance')
          if (balRes.data?.data && setUser) {
            setUser((prev) => (prev ? { ...prev, creditBalance: balRes.data.data.balance } : prev))
          }
        } catch { }

        setGenerationProgress(20)
        setGenerationStepText(`Job #${jobId.slice(0, 8)} enqueued (Queue pos #${backendJob.queuePosition || 1}) - waiting for Wan 2.1 video worker...`)

        const pollInterval = setInterval(async () => {
          try {
            const jobRes = await api.get(`/generation/jobs/${jobId}`)
            const jobData = jobRes.data?.data
            if (!jobData) return

            if (jobData.status === 'PROCESSING') {
              setGenerationProgress((prev) => Math.min(85, Math.max(prev, 50)))
              setGenerationStepText(`Synthesizing spatio-temporal video latents on ${currentModelObj.name}...`)
            } else if (jobData.status === 'COMPLETED') {
              clearInterval(pollInterval)

              const asset = jobData.assets?.[0]
              const rawSrc = asset?.src || asset?.storagePath

              if (!asset || !rawSrc) {
                setIsGenerating(false)
                setGenerationStepText('Video worker reported completion, but no valid video asset was returned.')
                setGenerationError({
                  isFlagged: false,
                  message: 'Video worker reported completion, but no valid video asset output was received.',
                  suggestion: 'Please retry your video generation.'
                })
                return
              }

              setGenerationProgress(100)
              setGenerationStepText('Video sequence ready!')

              const finalVideoUrl = rawSrc.startsWith('http') || rawSrc.startsWith('data:')
                ? rawSrc
                : (rawSrc.startsWith('/') ? rawSrc : `/${rawSrc}`)

              const newVideo = {
                id: jobData.id,
                title: finalPrompt.slice(0, 30) || 'Custom Motion Sequence',
                prompt: finalPrompt,
                model: currentModelObj.name,
                resolution: `${resolution === '720p' ? '1280×720' : '854×480'} (${aspectRatio})`,
                duration: duration,
                fps: fps,
                cameraMotion: cameraMotion,
                seed: randomSeedVal,
                timestamp: 'Just now',
                thumbnail: asset.thumbnailPath || finalVideoUrl,
                videoUrl: finalVideoUrl,
                badge: `${resolution} ${aspectRatio}`,
                status: 'COMPLETED'
              }

              setCurrentVideo(newVideo)
              setVideoHistory((prev) => {
                const combined = [newVideo, ...prev.filter((i) => i.id !== newVideo.id)]
                return combined.slice(0, 6)
              })
              setIsGenerating(false)
              setIsPlaying(true)
              setPlayerProgress(0)

              // Refresh credits
              try {
                const balRes = await api.get('/credits/balance')
                if (balRes.data?.data && setUser) {
                  setUser((prev) => (prev ? { ...prev, creditBalance: balRes.data.data.balance } : prev))
                }
              } catch { }
            } else if (jobData.status === 'FAILED' || jobData.status === 'CANCELED') {
              clearInterval(pollInterval)
              setIsGenerating(false)
              setGenerationProgress(0)
              setGenerationStepText(`Video job ${jobData.status.toLowerCase()}: ${jobData.errorMessage || 'AI inference error'}`)
              setGenerationError({
                isFlagged: /flagged|safety/i.test(jobData.errorMessage || ''),
                message: jobData.errorMessage || 'AI video inference error occurred.',
                suggestion: 'Any reserved credits have been fully restored to your account.'
              })

              // Refresh credits after refund
              try {
                const balRes = await api.get('/credits/balance')
                if (balRes.data?.data && setUser) {
                  setUser((prev) => (prev ? { ...prev, creditBalance: balRes.data.data.balance } : prev))
                }
              } catch { }
            }
          } catch (pollErr) {
            console.warn('[AI Video Poll Warning]', pollErr)
          }
        }, 1500)

        setTimeout(() => {
          clearInterval(pollInterval)
          setIsGenerating((prev) => {
            if (prev) {
              setGenerationStepText('Video job is still queued or processing on the AI engine. View under My Generations.')
              return false
            }
            return false
          })
        }, 90000)

        return
      }
    } catch (err) {
      setIsGenerating(false)
      setGenerationProgress(0)
      setGenerationStepText('')

      if (err.response?.status === 402) {
        setGenerationError({
          isFlagged: false,
          message: `Insufficient credits! You need at least ${currentModelObj.creditCost} credits to run this video job.`,
          suggestion: 'Top up your account or choose a draft video model.'
        })
        return
      }
      if (err.response?.status === 503) {
        const msg = err.response?.data?.error || 'AI video inference service is currently offline. No credits were deducted.'
        setGenerationError({
          isFlagged: false,
          message: msg,
          suggestion: 'The 3D DiT video GPU cluster is temporarily offline. Please retry in a few moments.'
        })
        return
      }
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Video generation request failed.'
      setGenerationError({
        isFlagged: /flagged|safety/i.test(errMsg),
        message: errMsg,
        suggestion: 'Please verify your motion prompt description and connection.'
      })
    }
  }

  const handleCopyPrompt = (text) => {
    navigator.clipboard?.writeText(text)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Page Header (Eye-friendly Dark Slate Studio Theme) */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shrink-0">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              Creation Studio
            </span>
            <span className="text-xs text-neutral-500 font-medium">/</span>
            <span className="text-xs text-neutral-400 font-medium truncate">Text-to-Video Interactive Demo</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            AI Video Generator
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Generate cinematic 5-second video sequences with Wan 2.1 3D DiT and LTX spatio-temporal video architectures.
          </p>
        </div>

        {/* Balance & Info */}
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
            Cost per video: <strong className="text-white font-semibold">{currentModelObj.creditCost} credits</strong>
          </div>
        </div>
      </div>

      {/* ROW 1: Motion Scene Prompt (Follower) + Video Preview Player (Master Height Driver) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:items-start items-start">
        {/* Main Prompt Card (Follower: matches Player height exactly) */}
        <div
          ref={promptCardRef}
          style={{ height: isDesktop && canvasHeight ? `${canvasHeight}px` : undefined }}
          className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 min-h-0 overflow-hidden"
        >
          {/* Top Section */}
          <div ref={promptTopRef} className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <label htmlFor="video-prompt-input" className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-cyan-400" />
                Motion Scene Prompt
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

            {/* Generation Error / Safety Filter Banner */}
            {generationError && (
              <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition-all ${generationError.isFlagged
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${generationError.isFlagged ? 'text-amber-400' : 'text-rose-400'}`} />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {generationError.isFlagged ? 'AI Output Moderation Notice' : 'Generation Error'}
                  </div>
                  <p className="leading-relaxed opacity-90">{generationError.message}</p>
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
                id="video-prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe subject dynamics, physical motion, camera trajectory, lighting and environment (e.g. Formula race car drifting around rain-slicked turn)..."
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
              {VIDEO_PROMPT_INSPIRATIONS.slice(0, visiblePresetsCount).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className="text-left text-xs bg-[#080B14] hover:bg-cyan-950/40 text-neutral-300 hover:text-cyan-200 hover:border-cyan-700/60 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all truncate w-full cursor-pointer h-[32px] shrink-0"
                  title={preset}
                >
                  🎬 {preset}
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
              {showNegative ? 'Hide Negative Prompt' : 'Add Negative Prompt (Avoid jitter, static, blur)'}
            </button>

            {showNegative && (
              <div className="mt-2">
                <textarea
                  rows={2}
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="e.g. jerky motion, flicker, unnatural physics, distorted hands, morphing artifacts, low bitrate..."
                  className="w-full rounded-xl p-2.5 text-xs bg-[#080B14] border border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500 focus:bg-[#0A0E17] focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Video Preview Player (Master Height Driver) */}
        <div
          ref={canvasCardRef}
          className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              Video Preview Player
            </h2>
            {isGenerating ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800/60 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                Rendering 3D DiT...
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                Demo Preview
              </span>
            )}
          </div>

          {/* Simulated Video Canvas */}
          <div
            className={cn(
              'relative w-full rounded-xl overflow-hidden bg-[#080B14] border border-neutral-800 flex items-center justify-center transition-all duration-300 mx-auto my-auto group',
              CANVAS_PREVIEW_CONFIG[aspectRatio]?.containerClass || 'aspect-video h-[280px] max-w-full'
            )}
          >
            {isGenerating ? (
              /* Real-time generation progress overlay */
              <div className="absolute inset-0 bg-[#080B14]/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center text-white space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center">
                  <Video className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">Generating 3D Spatio-Temporal Video</p>
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
            ) : currentVideo ? (
              /* Active Video Sequence */
              <div className="relative w-full h-full flex items-center justify-center bg-[#080B14]">
                <img
                  src={currentVideo.thumbnail}
                  alt={currentVideo.title}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Play Button Overlay */}
                <div
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 group-hover:bg-black/40 transition-colors"
                >
                  {!isPlaying && (
                    <div className="w-12 h-12 rounded-full bg-cyan-400/90 hover:bg-cyan-300 text-neutral-950 shadow-xl flex items-center justify-center pl-0.5 group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-neutral-950" />
                    </div>
                  )}
                </div>

                {/* Video Control Bar */}
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col gap-1.5">
                  {/* Progress scrubber */}
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden cursor-pointer">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-100"
                      style={{ width: `${playerProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-white text-[11px]">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerProgress(0)
                          setIsPlaying(true)
                        }}
                        className="hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Restart"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-[10px] text-neutral-300">
                        {((playerProgress / 100) * parseFloat(currentVideo.duration || '5.0s')).toFixed(1)}s / {currentVideo.duration || '5.0s'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModalItem(currentVideo)}
                        className="hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Expand view"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Default empty state */
              <div className="text-center p-6 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-800/80 flex items-center justify-center text-neutral-400 mx-auto border border-neutral-700/60">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-300">Video Canvas Ready</p>
                  <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
                    Configure your prompt on the left and click Generate Video to produce your first motion clip.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick action buttons below canvas */}
          {currentVideo && !isGenerating && (
            <div className="flex items-center justify-between pt-1 shrink-0">
              <span className="text-xs text-neutral-400">
                Seed: <strong className="font-mono text-white">{currentVideo.seed}</strong> • {currentVideo.resolution}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalItem(currentVideo)}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Inspect Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Video Foundation Model (Left) + Aspect Ratio & Video Specs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:items-stretch items-start">
        {/* Model Selection Card */}
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 lg:h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              Video Foundation Model
            </label>
            <span className="text-[11px] sm:text-xs text-neutral-400">Commercial Apache 2.0 Weights</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {VIDEO_MODELS.map((model) => {
              const isSelected = selectedModel === model.id
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id)
                    setDuration(model.defaultDuration)
                    setFps(model.defaultFps)
                  }}
                  className={cn(
                    'h-[108px] sm:h-[112px] p-2 sm:p-2.5 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between min-w-0',
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/20 text-white'
                      : 'border-neutral-800 bg-[#080B14] hover:bg-neutral-800/60 hover:border-neutral-700 text-neutral-300'
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white leading-tight break-words min-w-0">
                      {model.name}
                    </div>
                    <div className="mt-1 shrink-0">
                      <span className={cn('inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded border leading-none', model.badgeColor)}>
                        {model.badge}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 shrink-0 min-w-0">
                    <span className="truncate">{model.defaultDuration}</span>
                    <span className="font-semibold text-white shrink-0 ml-1">{model.creditCost} credits</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Video Specs: Aspect Ratio, Duration & Resolution */}
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 lg:h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              Aspect Ratio & Video Specs
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono text-neutral-400">
                {resolution === '720p' ? '1280×720' : '854×480'} • {duration}
              </span>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40 cursor-pointer"
                title="Camera motion & dynamics"
              >
                <Sliders className="w-3 h-3" />
                Motion
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* Aspect Ratio Column */}
            <div className="flex flex-col justify-between h-[108px] sm:h-[112px]">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Aspect Ratio</span>
              <div className="grid grid-cols-3 gap-1">
                {VIDEO_ASPECT_RATIOS.map((ratio) => {
                  const isSelected = aspectRatio === ratio.id
                  const IconComponent = ratio.icon
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => handleSelectAspectRatio(ratio.id)}
                      className={cn(
                        'h-[82px] p-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-w-0',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-neutral-800 bg-[#080B14] hover:bg-neutral-800 text-neutral-300'
                      )}
                    >
                      <IconComponent className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-cyan-400' : 'text-neutral-500')} />
                      <div className="font-bold text-[11px] text-white leading-none shrink-0">{ratio.id}</div>
                      <div className="text-[8px] text-neutral-400 leading-none truncate px-0.5">{ratio.label.split(' ')[1]}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duration Column */}
            <div className="flex flex-col justify-between h-[108px] sm:h-[112px]">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Duration</span>
              <div className="grid grid-cols-2 gap-1">
                {['3.0s', '5.0s'].map((d) => {
                  const isSelected = duration === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={cn(
                        'h-[82px] p-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-w-0',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-neutral-800 bg-[#080B14] hover:bg-neutral-800 text-neutral-300'
                      )}
                    >
                      <Clock className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-cyan-400' : 'text-neutral-500')} />
                      <div className="font-bold text-[11px] text-white leading-none shrink-0">{d}</div>
                      <div className="text-[8px] text-neutral-400 leading-none truncate px-0.5">{d === '5.0s' ? '81 frames' : '49 frames'}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Resolution Column */}
            <div className="flex flex-col justify-between h-[108px] sm:h-[112px]">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Quality</span>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: '720p', label: '720p', sub: 'HD' },
                  { id: '480p', label: '480p', sub: 'Draft' }
                ].map((res) => {
                  const isSelected = resolution === res.id
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setResolution(res.id)}
                      className={cn(
                        'h-[82px] p-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-w-0',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-neutral-800 bg-[#080B14] hover:bg-neutral-800 text-neutral-300'
                      )}
                    >
                      <Film className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-cyan-400' : 'text-neutral-500')} />
                      <div className="font-bold text-[11px] text-white leading-none shrink-0">{res.label}</div>
                      <div className="text-[8px] text-neutral-400 leading-none truncate px-0.5">{res.sub}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Camera Motion & Dynamics Drawer (If toggled) */}
      {showAdvanced && (
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-neutral-800/90 shadow-sm text-neutral-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Camera Motion & Dynamics Configuration
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="text-neutral-400 hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Camera Motion */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 block">Camera Trajectory</label>
              <select
                value={cameraMotion}
                onChange={(e) => setCameraMotion(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs bg-[#080B14] border border-neutral-700 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="pan_right">Pan Right Tracking</option>
                <option value="pan_left">Pan Left Tracking</option>
                <option value="zoom_in">Slow Zoom In (Dolly)</option>
                <option value="zoom_out">Slow Zoom Out</option>
                <option value="crane_down">Cinematic Crane Down</option>
                <option value="orbit">Circular Orbit</option>
                <option value="static">Static Tripod</option>
              </select>
            </div>

            {/* Motion Intensity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-neutral-300">
                <span>Motion Dynamic Intensity</span>
                <span className="font-mono text-cyan-400">{motionIntensity} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={motionIntensity}
                onChange={(e) => setMotionIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-neutral-400">Controls speed and kinetic action in scene.</p>
            </div>

            {/* Seed Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 block">RNG Seed Lock</label>
                <button
                  type="button"
                  onClick={() => setIsRandomSeed(!isRandomSeed)}
                  className="text-[11px] text-cyan-400 font-medium hover:text-cyan-300 cursor-pointer"
                >
                  {isRandomSeed ? '✓ Random Seed' : 'Lock Seed'}
                </button>
              </div>
              <input
                type="text"
                disabled={isRandomSeed}
                value={isRandomSeed ? 'Randomized Seed' : seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="e.g. 592810"
                className="w-full rounded-xl px-3 py-2 text-xs bg-[#080B14] border border-neutral-700 text-neutral-100 disabled:bg-neutral-900 disabled:text-neutral-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ROW 3: Generate Action Button (Centered, Compact on Desktop, Full-width on Mobile) */}
      <div className="flex justify-center w-full py-1">
        <Button
          variant="gradient"
          size="md"
          onClick={handleGenerate}
          isLoading={isGenerating}
          leftIcon={Video}
          className="w-full sm:w-[280px] h-[46px] justify-center font-bold text-sm sm:text-base shadow-xl shadow-indigo-950/40 hover:shadow-indigo-900/60 transition-all cursor-pointer rounded-xl shrink-0"
        >
          {isGenerating ? 'Synthesizing 3D DiT...' : `Generate Video (${currentModelObj.creditCost} Credits)`}
        </Button>
      </div>

      {/* ROW 4: Studio Gallery / Recent Generations */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Generations
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Click any video thumbnail to preview in player, re-use prompt, or inspect metadata.
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-full">
            {videoHistory.length}
          </span>
        </div>

        {/* Gallery Grid or Empty State */}
        {loadingRecent && videoHistory.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs text-neutral-400">Loading recent videos…</p>
          </div>
        ) : videoHistory.length === 0 ? (
          <div className="py-10 px-4 rounded-xl border border-dashed border-neutral-800 bg-[#080B14]/60 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-2.5">
              <Video className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-xs font-semibold text-neutral-200">Your recent videos will appear here</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
              Generate a video using the prompt bar above to populate your recent studio gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
            {videoHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setCurrentVideo(item)
                  setIsPlaying(true)
                  setPlayerProgress(0)
                }}
                className={cn(
                  'group relative aspect-video rounded-xl overflow-hidden border bg-[#080B14] cursor-pointer transition-all flex items-center justify-center p-0.5',
                  currentVideo?.id === item.id
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-cyan-500/10'
                    : 'border-neutral-800 hover:border-cyan-500/60'
                )}
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Subtle dark gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                  <span className="text-[9px] font-semibold bg-black/70 px-1.5 py-0.5 rounded self-start border border-white/20">
                    {item.duration} • {item.badge}
                  </span>
                  <div>
                    <p className="text-[10px] font-medium line-clamp-1 text-neutral-200">{item.title}</p>
                    <span className="text-[9px] text-cyan-300 font-mono mt-0.5">{item.resolution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {activeModalItem && (
        <Modal
          isOpen={!!activeModalItem}
          onClose={() => setActiveModalItem(null)}
          title="Video Sequence Inspection"
          description="Detailed metadata parameters and production export options"
          theme="dark"
          className="max-w-2xl bg-[#0D111C] text-neutral-100 border-neutral-800"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#080B14] flex items-center justify-center max-h-96">
              <img
                src={activeModalItem.thumbnail}
                alt={activeModalItem.title}
                className="max-h-96 w-auto object-contain"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#080B14] border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span>Motion Scene Prompt</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Model</span>
                <span className="font-semibold text-white">{activeModalItem.model}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Resolution</span>
                <span className="font-semibold text-white">{activeModalItem.resolution}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Camera Motion</span>
                <span className="font-semibold text-white">{activeModalItem.cameraMotion}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Seed & Frames</span>
                <span className="font-mono font-semibold text-cyan-300">{activeModalItem.seed} ({activeModalItem.duration})</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrompt(activeModalItem.prompt)
                  setActiveModalItem(null)
                }}
                leftIcon={Wand2}
                className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white"
              >
                Use this Prompt
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModalItem(null)}
                  className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border-neutral-700"
                >
                  Close
                </Button>
                <a
                  href={activeModalItem.thumbnail}
                  download="kiaan-video-poster.jpg"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Poster
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default VideoGeneratorPage
