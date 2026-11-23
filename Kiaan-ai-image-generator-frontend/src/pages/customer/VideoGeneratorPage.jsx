import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sparkles,
  Wand2,
  Video,
  Film,
  Play,
  RotateCcw,
  RefreshCw,
  Download,
  Copy,
  Check,
  Maximize2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Clock,
  Coins,
  AlertTriangle,
  X,
  Lock,
  Camera
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'

// Curated inspiration prompts for Video exploration (Preserving all prompts from both branches)
const VIDEO_PROMPT_INSPIRATIONS = [
  'Cinematic drone flyover above a secluded tropical island waterfall at sunset, lush jungle mist, golden hour volumetric rays.',
  'Formula race car drifting around a rain-slicked asphalt curve at night, sparks flying, tire smoke reflecting neon stadium lights.',
  'Futuristic cybernetic metropolis street tracking shot, flying hover vehicles cruising between glowing holographic skyscrapers in heavy rain.',
  'Slow-motion macro shot of an espresso drop splashing into a porcelain cup with creamy swirling crema ripples.',
  'Majestic snow leopard stalking silently across high Himalayan peaks at dawn, hyperrealistic fur dynamics.',
  'Ocean wave barrel curling over a shallow coral reef in crystal-clear turquoise waters with natural sunlight caustics.',
  'Cyberpunk street samurai walking through a neon-lit Tokyo alleyway in heavy rain, reflections in puddles.',
  'Astronaut floating weightlessly inside a high-tech orbital space station viewing Earth through a panoramic cupola window.'
]

// Video Foundation Models (Open-weights architecture — marked Coming Soon)
const VIDEO_MODELS = [
  {
    id: 'wan-2.1-t2v-1.3b',
    name: 'Wan 2.1 Video (Draft 480p)',
    badge: 'Coming Soon',
    badgeColor: 'bg-neutral-900/90 text-neutral-400 border-neutral-700/60',
    description: 'Fast 3D spatio-temporal video synthesis at 854×480. Ideal for rapid shot ideation.',
    creditCost: 12,
    defaultDuration: '5.0s',
    defaultFps: 16,
    resolution: '854×480',
    isAvailable: false
  },
  {
    id: 'wan-2.1-t2v-14b',
    name: 'Wan 2.1 Video (Cinema 720p)',
    badge: 'Coming Soon',
    badgeColor: 'bg-neutral-900/90 text-neutral-400 border-neutral-700/60',
    description: 'High-definition 1280×720 cinematic video generation with fluid 3D DiT dynamic camera motion.',
    creditCost: 25,
    defaultDuration: '5.0s',
    defaultFps: 24,
    resolution: '1280×720',
    isAvailable: false
  },
  {
    id: 'ltx-video-0.9',
    name: 'LTX-Video 0.9.1 (Spatial)',
    badge: 'Coming Soon',
    badgeColor: 'bg-neutral-900/90 text-neutral-400 border-neutral-700/60',
    description: 'Lightweight spatio-temporal video foundation model for dynamic action sequences.',
    creditCost: 18,
    defaultDuration: '4.0s',
    defaultFps: 24,
    resolution: '1280×720',
    isAvailable: false
  }
]

export function VideoGeneratorPage() {
  const { user } = useAuth()

  // Form State
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [showNegative, setShowNegative] = useState(false)
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0].id)
  const [duration, setDuration] = useState('5.0s')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('720p')
  const [fps, setFps] = useState(24)
  const [cameraMotion, setCameraMotion] = useState('pan_right')

  // Real Gallery History from backend
  const [videoHistory, setVideoHistory] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  // Inspection Modal
  const [activeModalItem, setActiveModalItem] = useState(null)
  const [copiedNotification, setCopiedNotification] = useState(false)

  // Layout references for Master-Follower equal-height synchronization on Desktop
  const canvasCardRef = useRef(null)
  const promptCardRef = useRef(null)
  const promptTopRef = useRef(null)
  const promptBottomRef = useRef(null)
  const presetsHeaderRef = useRef(null)

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  const [canvasHeight, setCanvasHeight] = useState(460)
  const [visiblePresetsCount, setVisiblePresetsCount] = useState(3)

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
    const count = Math.max(1, Math.min(VIDEO_PROMPT_INSPIRATIONS.length, Math.floor((usableHeight + 6) / 38)))
    setVisiblePresetsCount((prev) => (prev !== count ? count : prev))
  }, [canvasHeight, showNegative])

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
  }, [updatePresetsCount])

  // Fetch logged-in user's real video generations from authenticated assets API
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
          const isTextToVideo =
            item.generationType === 'TEXT_TO_VIDEO' ||
            item.jobType === 'TEXT_TO_VIDEO' ||
            item.tool === 'Text-to-Video'
          return isVideo && isTextToVideo
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((item) => {
          const rawSrc = item.src || item.storagePath || ''
          const videoUrl =
            rawSrc.startsWith('http') || rawSrc.startsWith('data:')
              ? rawSrc
              : rawSrc.startsWith('/')
              ? rawSrc
              : `/${rawSrc}`
          const rawThumb = item.poster || item.thumbnailPath || videoUrl
          const thumbUrl =
            rawThumb.startsWith('http') || rawThumb.startsWith('data:')
              ? rawThumb
              : rawThumb.startsWith('/')
              ? rawThumb
              : `/${rawThumb}`

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
    } catch (err) {
      console.error('Failed to load recent video generations:', err)
      setVideoHistory([])
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentVideos()
  }, [fetchRecentVideos])

  // Current model helper
  const currentModelObj = VIDEO_MODELS.find((m) => m.id === selectedModel) || VIDEO_MODELS[0]

  // Prompt Enhancer
  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      setPrompt(
        'Cinematic drone flyover above a secluded tropical island waterfall at sunset, lush jungle mist, golden hour volumetric rays'
      )
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

  // Copy prompt to clipboard
  const handleCopyPrompt = (text) => {
    navigator.clipboard?.writeText(text)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Header Card (Matching Text-to-Image and Image-to-Image Studio Theme) */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Creation Studio
            </span>
            <span className="text-xs text-neutral-500 font-medium">/</span>
            <span className="text-xs text-neutral-400 font-medium truncate">Text-to-Video Studio</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-neutral-400 border border-neutral-700/60 shrink-0 ml-1">
              <Lock className="w-2.5 h-2.5 text-neutral-500" />
              Coming Soon
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            Text-to-Video Studio
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Synthesize cinematic video sequences with Wan 2.1 3D DiT and LTX spatio-temporal video architectures.
          </p>
        </div>

        {/* Available Credits display & Cost per video */}
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
            Cost per video: <strong className="text-white font-semibold">12-25 credits (Coming Soon)</strong>
          </div>
        </div>
      </div>

      {/* ROW 1: Two Equal Columns (Prompt Card Follower + Video Preview Canvas Master) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:items-start items-start">
        {/* LEFT COLUMN: Video Prompt Card */}
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
                Prompt Description
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

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                id="video-prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe subject dynamics, physical motion, camera trajectory, lighting and environment (e.g. Formula race car drifting around rain-slicked curve)..."
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

          {/* Middle Section: Inspiration Presets (Dynamic Fit) */}
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

          {/* Bottom Section: Negative Prompt Accordion */}
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

        {/* RIGHT COLUMN: Video Preview Canvas (Master Height Driver) */}
        <div
          ref={canvasCardRef}
          className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              Real-Time Video Canvas
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900/90 text-neutral-400 border border-neutral-700/60">
              <Lock className="w-3 h-3 text-neutral-500" />
              Coming Soon
            </span>
          </div>

          {/* 16:9 Video Preview Canvas Box */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#080B14] border border-neutral-800 flex items-center justify-center transition-all duration-300 mx-auto my-auto">
            <div className="text-center p-6 sm:p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0D111C] border border-neutral-800 flex items-center justify-center text-neutral-400 mx-auto shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                  <Play className="w-5 h-5 fill-cyan-400/40 text-cyan-400 ml-0.5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-200">Your generated video will appear here</p>
                <p className="text-xs text-neutral-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  AI Text-to-Video synthesis is currently in active development. When available, rendered video sequences will stream directly into this preview player.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-neutral-900/80 text-cyan-400 border border-neutral-800">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Spatio-Temporal 3D DiT Video Engine
              </div>
            </div>
          </div>

          {/* Canvas Footer Status */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 shrink-0 mt-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
              Status: In Development (Demo Mode)
            </span>
            <span className="font-mono text-neutral-400">16:9 • 1280×720 HD</span>
          </div>
        </div>
      </div>

      {/* ROW 2: Two Equal Columns (AI Video Model Selection Left + Video Settings Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:items-stretch items-start">
        {/* LEFT COLUMN: AI Video Model Selection Card */}
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 lg:h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              AI Video Model
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
                    if (model.defaultDuration) setDuration(model.defaultDuration)
                    if (model.defaultFps) setFps(model.defaultFps)
                  }}
                  className={cn(
                    'h-[108px] sm:h-[112px] p-2 sm:p-2.5 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between min-w-0 opacity-80 hover:opacity-100',
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
                    <span className="truncate">{model.defaultDuration} • {model.defaultFps}fps</span>
                    <span className="font-semibold text-neutral-400 shrink-0 ml-1">{model.creditCost} credits</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Video Settings Card */}
        <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-neutral-800/90 shadow-sm flex flex-col justify-between text-neutral-100 lg:h-full">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              Video Specifications & Dynamics
            </label>
            <span className="text-[11px] sm:text-xs font-mono text-neutral-400">
              {resolution === '720p' ? '1280×720 HD' : '854×480 Draft'} • {aspectRatio}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {/* Duration */}
            <div className="h-[108px] sm:h-[112px] p-2 rounded-xl border border-neutral-800 bg-[#080B14] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Duration</div>
              <div className="grid grid-cols-2 gap-1 my-auto">
                {['3.0s', '5.0s'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      'py-1 px-1 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer',
                      duration === d
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/60'
                        : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-neutral-500 truncate">{duration === '5.0s' ? '80 frames' : '48 frames'}</div>
            </div>

            {/* Resolution */}
            <div className="h-[108px] sm:h-[112px] p-2 rounded-xl border border-neutral-800 bg-[#080B14] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Resolution</div>
              <div className="grid grid-cols-2 gap-1 my-auto">
                {['720p', '480p'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={cn(
                      'py-1 px-1 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer',
                      resolution === r
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/60'
                        : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-neutral-500 truncate">{resolution === '720p' ? '1280×720' : '854×480'}</div>
            </div>

            {/* Aspect Ratio */}
            <div className="h-[108px] sm:h-[112px] p-2 rounded-xl border border-neutral-800 bg-[#080B14] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Aspect Ratio</div>
              <div className="grid grid-cols-3 gap-1 my-auto">
                {['16:9', '9:16', '1:1'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      'py-1 px-0.5 rounded-lg text-[11px] font-semibold transition-all text-center cursor-pointer',
                      aspectRatio === ratio
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/60'
                        : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-neutral-500 truncate">
                {aspectRatio === '16:9' ? 'Cinema' : aspectRatio === '9:16' ? 'Vertical' : 'Square'}
              </div>
            </div>

            {/* Camera Motion */}
            <div className="h-[108px] sm:h-[112px] p-2 rounded-xl border border-neutral-800 bg-[#080B14] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Camera className="w-2.5 h-2.5 text-cyan-400" />
                Camera Motion
              </div>
              <div className="my-auto">
                <select
                  value={cameraMotion}
                  onChange={(e) => setCameraMotion(e.target.value)}
                  className="w-full rounded-lg px-2 py-1 text-xs bg-neutral-900 border border-neutral-700/80 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="pan_right">Pan Right</option>
                  <option value="pan_left">Pan Left</option>
                  <option value="zoom_in">Dolly In</option>
                  <option value="zoom_out">Dolly Out</option>
                  <option value="crane_down">Crane Down</option>
                  <option value="orbit">Orbit</option>
                  <option value="static">Static Tripod</option>
                </select>
              </div>
              <div className="text-[9px] text-neutral-500 truncate">Dynamics & Trajectory</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Generate Action Button (Centered, Disabled with Honest Coming Soon State) */}
      <div className="flex flex-col items-center justify-center w-full py-1 gap-2">
        <Button
          variant="gradient"
          size="md"
          disabled={true}
          leftIcon={Sparkles}
          className="w-full sm:w-[280px] h-[46px] justify-center font-bold text-sm sm:text-base opacity-60 cursor-not-allowed rounded-xl shrink-0 border border-cyan-800/40"
        >
          Video Generation Coming Soon
        </Button>
        <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-neutral-400" />
          Video synthesis is currently in active development. No credits will be charged.
        </p>
      </div>

      {/* ROW 4: Studio Gallery / Recent Video Generations */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Generations
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Saved video sequences and generation metadata from your account.
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-full">
            {videoHistory.length}
          </span>
        </div>

        {/* Gallery Grid or Honest Empty State */}
        {loadingRecent && videoHistory.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs text-neutral-400">Loading recent video generations…</p>
          </div>
        ) : videoHistory.length === 0 ? (
          <div className="py-10 px-4 rounded-xl border border-dashed border-neutral-800 bg-[#080B14]/60 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-2.5">
              <Film className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-xs font-semibold text-neutral-200">Your recent video generations will appear here</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs leading-relaxed">
              Once video generation goes live, your rendered video sequences and metadata will be saved here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
            {videoHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModalItem(item)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-[#080B14] cursor-pointer hover:border-cyan-500 hover:shadow-cyan-500/10 transition-all flex items-center justify-center"
              >
                <img
                  src={item.thumbnail}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                  <p className="text-[10px] font-medium line-clamp-1 text-neutral-200">{item.prompt}</p>
                  <span className="text-[9px] text-cyan-300 font-mono mt-0.5">{item.duration} • {item.resolution}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail / Inspection Modal for real video assets */}
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
            {/* Video / Poster Box */}
            <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#080B14] flex items-center justify-center max-h-96">
              {activeModalItem.videoUrl && activeModalItem.videoUrl.endsWith('.mp4') ? (
                <video
                  src={activeModalItem.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-96 w-full object-contain"
                />
              ) : (
                <img
                  src={activeModalItem.thumbnail}
                  alt={activeModalItem.title}
                  className="max-h-96 w-auto object-contain"
                />
              )}
            </div>

            {/* Prompt description banner */}
            <div className="p-3.5 rounded-xl bg-[#080B14] border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span>Motion Scene Prompt</span>
                <button
                  type="button"
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

            {/* Parameter badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Model</span>
                <span className="font-semibold text-white truncate block">{activeModalItem.model}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Resolution</span>
                <span className="font-semibold text-white">{activeModalItem.resolution}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Duration</span>
                <span className="font-semibold text-white">{activeModalItem.duration}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B14] border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] font-semibold uppercase">Created</span>
                <span className="text-neutral-300">{activeModalItem.timestamp}</span>
              </div>
            </div>

            {/* Action buttons */}
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
                {activeModalItem.videoUrl && (
                  <a
                    href={activeModalItem.videoUrl}
                    download="kiaan-video.mp4"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default VideoGeneratorPage
