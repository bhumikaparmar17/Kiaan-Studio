import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Edit3,
  Upload,
  RotateCw,
  RotateCcw,
  Crop,
  Sun,
  Contrast,
  Sliders,
  Sparkles,
  Download,
  Check,
  Maximize2,
  Brush,
  Eraser,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Trash2,
  Layers,
  Palette,
  Type,
  Square,
  Circle,
  Minus,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  X
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../utils/cn'

// Preset Photographic Filters
const PRESET_FILTERS = [
  { id: 'normal', name: 'Normal', filterStr: 'none' },
  { id: 'cinematic', name: 'Cinematic', filterStr: 'contrast(1.2) saturate(1.25) hue-rotate(-5deg)' },
  { id: 'warm', name: 'Warm Amber', filterStr: 'sepia(0.3) saturate(1.3) brightness(1.05)' },
  { id: 'cool', name: 'Cool Slate', filterStr: 'saturate(0.9) hue-rotate(25deg) brightness(1.05)' },
  { id: 'noir', name: 'B&W Noir', filterStr: 'grayscale(1) contrast(1.4) brightness(0.95)' },
  { id: 'vintage', name: 'Vintage 70s', filterStr: 'sepia(0.5) contrast(1.1) brightness(0.95)' },
  { id: 'vivid', name: 'Vivid Pop', filterStr: 'saturate(1.6) contrast(1.15)' },
  { id: 'sepia', name: 'Classic Sepia', filterStr: 'sepia(0.85) contrast(1.05)' }
]

// Preset Crop Aspect Ratios
const CROP_RATIOS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '16:9', label: '16:9 Cinema', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Classic', ratio: 4 / 3 },
  { id: '9:16', label: '9:16 Portrait', ratio: 9 / 16 }
]

// Quick Color Swatches for Drawing and Text
const COLOR_SWATCHES = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ffffff', // White
  '#000000'  // Black
]

export function ImageEditorPage() {
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Loaded Image State
  const [originalImageSrc, setOriginalImageSrc] = useState('/images/landing/edit-cyberpunk.jpg')
  const [currentBaseImageSrc, setCurrentBaseImageSrc] = useState('/images/landing/edit-cyberpunk.jpg')
  const [imageName, setImageName] = useState('edit-cyberpunk.jpg')
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 1024, height: 1024 })
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Active Tool Tab: 'adjust' | 'filter' | 'crop' | 'draw' | 'text'
  const [activeTab, setActiveTab] = useState('adjust')

  // Color & Tone Adjustments
  const [brightness, setBrightness] = useState(100) // % (30 - 180)
  const [contrast, setContrast] = useState(100)     // % (40 - 180)
  const [saturation, setSaturation] = useState(100) // % (0 - 200)
  const [exposure, setExposure] = useState(0)       // (-50 to +50)

  // Filters
  const [activeFilter, setActiveFilter] = useState('normal')

  // Geometry / Orientation
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)

  // Crop Tool State
  const [isCropping, setIsCropping] = useState(false)
  const [cropRatio, setCropRatio] = useState('free')
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 }) // in percent of canvas
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 })

  // Resize Tool State
  const [resizeWidth, setResizeWidth] = useState(1024)
  const [resizeHeight, setResizeHeight] = useState(1024)
  const [maintainAspect, setMaintainAspect] = useState(true)

  // Draw & Shapes State
  const [drawTool, setDrawTool] = useState('brush') // 'brush' | 'eraser' | 'line' | 'rect' | 'circle'
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [drawColor, setDrawColor] = useState('#06b6d4')
  const [annotations, setAnnotations] = useState([]) // Array of drawings, shapes, text items
  const [activeShapeStart, setActiveShapeStart] = useState(null)
  const [activeShapeCurrent, setActiveShapeCurrent] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState([])

  // Text Overlay State
  const [textInput, setTextInput] = useState('Kiaan Studio')
  const [fontSize, setFontSize] = useState(36)
  const [textColor, setTextColor] = useState('#ffffff')
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif')
  const [isBold, setIsBold] = useState(true)
  const [isItalic, setIsItalic] = useState(false)

  // Viewport Interaction State (Zoom & Pan, Before/After)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isShowingBefore, setIsShowingBefore] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Export Settings
  const [exportFormat, setExportFormat] = useState('image/jpeg') // 'image/png' | 'image/jpeg' | 'image/webp'
  const [exportQuality, setExportQuality] = useState(0.92)

  // Reset Confirmation Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Notifications
  const [notification, setNotification] = useState('')

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isApplyingHistoryRef = useRef(false)

  // Base Image DOM element ref
  const currentImageElementRef = useRef(null)
  const originalImageElementRef = useRef(null)

  // Show transient toast
  const showToast = useCallback((msg) => {
    setNotification(msg)
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? '' : prev))
    }, 2800)
  }, [])

  // Build the CSS filter string
  const getFilterStyle = useCallback(() => {
    const effectiveBrightness = Math.max(0, brightness + exposure)
    const effectiveContrast = Math.max(0, contrast + Math.round(Math.abs(exposure) * 0.2))
    const base = `brightness(${effectiveBrightness}%) contrast(${effectiveContrast}%) saturate(${saturation}%)`
    const presetObj = PRESET_FILTERS.find((f) => f.id === activeFilter)
    if (presetObj && presetObj.filterStr !== 'none') {
      return `${base} ${presetObj.filterStr}`
    }
    return base
  }, [brightness, contrast, saturation, exposure, activeFilter])

  // Push snapshot to undo stack
  const pushHistorySnapshot = useCallback((override = {}) => {
    if (isApplyingHistoryRef.current) return

    const snapshot = {
      baseImageSrc: currentBaseImageSrc,
      brightness,
      contrast,
      saturation,
      exposure,
      activeFilter,
      rotation,
      flipH,
      flipV,
      annotations: JSON.parse(JSON.stringify(annotations)),
      naturalDimensions: { ...naturalDimensions },
      ...override
    }

    setHistoryStack((prev) => {
      const truncated = prev.slice(0, historyIndex + 1)
      const nextStack = [...truncated, snapshot]
      if (nextStack.length > 30) {
        nextStack.shift()
      }
      return nextStack
    })
    setHistoryIndex((prev) => Math.min(prev + 1, 29))
  }, [
    currentBaseImageSrc,
    brightness,
    contrast,
    saturation,
    exposure,
    activeFilter,
    rotation,
    flipH,
    flipV,
    annotations,
    naturalDimensions,
    historyIndex
  ])

  // Load and cache an image source
  const loadImage = useCallback((src, isOriginal = false) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src
    img.onload = () => {
      if (isOriginal) {
        originalImageElementRef.current = img
      }
      currentImageElementRef.current = img
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      setResizeWidth(img.naturalWidth)
      setResizeHeight(img.naturalHeight)
      setIsImageLoaded(true)
    }
    img.onerror = () => {
      console.warn('Failed to load image:', src)
      setIsImageLoaded(true)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadImage(originalImageSrc, true)
    loadImage(currentBaseImageSrc, false)
  }, [originalImageSrc, currentBaseImageSrc, loadImage])

  // Initialize history with initial state
  useEffect(() => {
    if (isImageLoaded && historyStack.length === 0) {
      const initialSnapshot = {
        baseImageSrc: currentBaseImageSrc,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        exposure: 0,
        activeFilter: 'normal',
        rotation: 0,
        flipH: false,
        flipV: false,
        annotations: [],
        naturalDimensions
      }
      setHistoryStack([initialSnapshot])
      setHistoryIndex(0)
    }
  }, [isImageLoaded, currentBaseImageSrc, naturalDimensions, historyStack.length])

  // RENDER CANVAS
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Choose image source based on Before/After toggle
    const img = isShowingBefore ? originalImageElementRef.current : currentImageElementRef.current
    if (!img || !img.complete || img.naturalWidth === 0) return

    // Calculate canvas bounds based on rotation
    const isSideways = !isShowingBefore && (rotation === 90 || rotation === 270)
    const targetWidth = isSideways ? img.naturalHeight : img.naturalWidth
    const targetHeight = isSideways ? img.naturalWidth : img.naturalHeight

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    // 1. Draw base image with filters and orientation
    if (isShowingBefore) {
      // Clean, unadjusted original
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.restore()

      // Overlay Before Badge
      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
      ctx.fillRect(16, 16, 140, 32)
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 1.5
      ctx.strokeRect(16, 16, 140, 32)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.fillText('BEFORE (Original)', 28, 36)
      ctx.restore()
      return
    }

    // Normal mode: Center-based rotation and flip
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)

    // Apply color grading & filters
    ctx.filter = getFilterStyle()
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()

    // 2. Render Annotations & Drawing Layer
    ctx.save()
    ctx.filter = 'none'

    annotations.forEach((ann) => {
      if (ann.type === 'path') {
        if (!ann.points || ann.points.length < 2) return
        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (ann.isEraser) {
          ctx.globalCompositeOperation = 'destination-out'
        } else {
          ctx.globalCompositeOperation = 'source-over'
        }
        ctx.moveTo(ann.points[0].x, ann.points[0].y)
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y)
        }
        ctx.stroke()
        ctx.restore()
      } else if (ann.type === 'rect') {
        ctx.save()
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.strokeWidth
        ctx.strokeRect(ann.x, ann.y, ann.width, ann.height)
        ctx.restore()
      } else if (ann.type === 'circle') {
        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.strokeWidth
        ctx.arc(ann.cx, ann.cy, Math.max(0, ann.radius), 0, 2 * Math.PI)
        ctx.stroke()
        ctx.restore()
      } else if (ann.type === 'line') {
        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.strokeWidth
        ctx.lineCap = 'round'
        ctx.moveTo(ann.x1, ann.y1)
        ctx.lineTo(ann.x2, ann.y2)
        ctx.stroke()
        ctx.restore()
      } else if (ann.type === 'text') {
        ctx.save()
        ctx.fillStyle = ann.color
        const fontStr = `${ann.italic ? 'italic ' : ''}${ann.bold ? 'bold ' : ''}${ann.fontSize}px ${ann.fontFamily || 'Inter, sans-serif'}`
        ctx.font = fontStr
        ctx.textBaseline = 'top'
        ctx.fillText(ann.text, ann.x, ann.y)
        ctx.restore()
      }
    })

    // 3. Render active real-time in-progress drawing or shape
    if (isDrawing) {
      if ((drawTool === 'brush' || drawTool === 'eraser') && currentPath.length > 1) {
        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = drawColor
        ctx.lineWidth = strokeWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (drawTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
        }
        ctx.moveTo(currentPath[0].x, currentPath[0].y)
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y)
        }
        ctx.stroke()
        ctx.restore()
      } else if (activeShapeStart && activeShapeCurrent) {
        ctx.save()
        ctx.strokeStyle = drawColor
        ctx.lineWidth = strokeWidth
        if (drawTool === 'rect') {
          const x = Math.min(activeShapeStart.x, activeShapeCurrent.x)
          const y = Math.min(activeShapeStart.y, activeShapeCurrent.y)
          const w = Math.abs(activeShapeCurrent.x - activeShapeStart.x)
          const h = Math.abs(activeShapeCurrent.y - activeShapeStart.y)
          ctx.strokeRect(x, y, w, h)
        } else if (drawTool === 'circle') {
          const dx = activeShapeCurrent.x - activeShapeStart.x
          const dy = activeShapeCurrent.y - activeShapeStart.y
          const radius = Math.sqrt(dx * dx + dy * dy)
          ctx.beginPath()
          ctx.arc(activeShapeStart.x, activeShapeStart.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        } else if (drawTool === 'line') {
          ctx.beginPath()
          ctx.lineCap = 'round'
          ctx.moveTo(activeShapeStart.x, activeShapeStart.y)
          ctx.lineTo(activeShapeCurrent.x, activeShapeCurrent.y)
          ctx.stroke()
        }
        ctx.restore()
      }
    }

    // 4. Render Crop Overlay if in Crop Mode
    if (isCropping) {
      ctx.save()
      const cropX = (cropBox.x / 100) * canvas.width
      const cropY = (cropBox.y / 100) * canvas.height
      const cropW = (cropBox.width / 100) * canvas.width
      const cropH = (cropBox.height / 100) * canvas.height

      // Darken outside area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
      ctx.fillRect(0, 0, canvas.width, cropY)
      ctx.fillRect(0, cropY + cropH, canvas.width, canvas.height - (cropY + cropH))
      ctx.fillRect(0, cropY, cropX, cropH)
      ctx.fillRect(cropX + cropW, cropY, canvas.width - (cropX + cropW), cropH)

      // Crop bounding box & handles
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 6])
      ctx.strokeRect(cropX, cropY, cropW, cropH)
      ctx.setLineDash([])

      // Corner handles
      const handleSize = 12
      ctx.fillStyle = '#06b6d4'
      ctx.fillRect(cropX - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(cropX + cropW - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(cropX - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize)
      ctx.fillRect(cropX + cropW - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize)

      ctx.restore()
    }

    ctx.restore()
  }, [
    isShowingBefore,
    rotation,
    flipH,
    flipV,
    getFilterStyle,
    annotations,
    isDrawing,
    drawTool,
    currentPath,
    activeShapeStart,
    activeShapeCurrent,
    drawColor,
    strokeWidth,
    isCropping,
    cropBox
  ])

  // Re-render canvas whenever relevant properties change
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Get mouse/touch coordinate relative to internal canvas pixels
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // DRAWING MOUSE / TOUCH HANDLERS
  const handleCanvasMouseDown = (e) => {
    if (isShowingBefore) return

    // If in Crop Mode, handle crop box dragging
    if (isCropping) {
      setIsDraggingCrop(true)
      const coords = getCanvasCoords(e)
      setCropDragStart(coords)
      return
    }

    if (activeTab === 'draw') {
      const coords = getCanvasCoords(e)
      setIsDrawing(true)

      if (drawTool === 'brush' || drawTool === 'eraser') {
        setCurrentPath([coords])
      } else {
        setActiveShapeStart(coords)
        setActiveShapeCurrent(coords)
      }
    } else if (activeTab === 'text') {
      const coords = getCanvasCoords(e)
      // Place text at click location
      const newText = {
        id: `text-${Date.now()}`,
        type: 'text',
        text: textInput || 'Text Overlay',
        x: coords.x,
        y: coords.y,
        fontSize,
        color: textColor,
        fontFamily,
        bold: isBold,
        italic: isItalic
      }
      setAnnotations((prev) => [...prev, newText])
      pushHistorySnapshot({ annotations: [...annotations, newText] })
      showToast('Text layer added to canvas')
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (isShowingBefore) return

    if (isCropping && isDraggingCrop) {
      const canvas = canvasRef.current
      if (!canvas) return
      const coords = getCanvasCoords(e)
      const dxPercent = ((coords.x - cropDragStart.x) / canvas.width) * 100
      const dyPercent = ((coords.y - cropDragStart.y) / canvas.height) * 100

      setCropBox((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, prev.x + dxPercent)),
        y: Math.max(0, Math.min(100 - prev.height, prev.y + dyPercent))
      }))
      setCropDragStart(coords)
      return
    }

    if (!isDrawing || activeTab !== 'draw') return

    const coords = getCanvasCoords(e)

    if (drawTool === 'brush' || drawTool === 'eraser') {
      setCurrentPath((prev) => [...prev, coords])
    } else {
      setActiveShapeCurrent(coords)
    }
  }

  const handleCanvasMouseUp = () => {
    if (isCropping) {
      setIsDraggingCrop(false)
      return
    }

    if (!isDrawing || activeTab !== 'draw') return

    setIsDrawing(false)

    if (drawTool === 'brush' || drawTool === 'eraser') {
      if (currentPath.length > 1) {
        const newPath = {
          id: `path-${Date.now()}`,
          type: 'path',
          isEraser: drawTool === 'eraser',
          color: drawColor,
          size: strokeWidth,
          points: currentPath
        }
        const updated = [...annotations, newPath]
        setAnnotations(updated)
        pushHistorySnapshot({ annotations: updated })
      }
      setCurrentPath([])
    } else if (activeShapeStart && activeShapeCurrent) {
      let newShape = null
      if (drawTool === 'rect') {
        newShape = {
          id: `rect-${Date.now()}`,
          type: 'rect',
          color: drawColor,
          strokeWidth,
          x: Math.min(activeShapeStart.x, activeShapeCurrent.x),
          y: Math.min(activeShapeStart.y, activeShapeCurrent.y),
          width: Math.abs(activeShapeCurrent.x - activeShapeStart.x),
          height: Math.abs(activeShapeCurrent.y - activeShapeStart.y)
        }
      } else if (drawTool === 'circle') {
        const dx = activeShapeCurrent.x - activeShapeStart.x
        const dy = activeShapeCurrent.y - activeShapeStart.y
        newShape = {
          id: `circle-${Date.now()}`,
          type: 'circle',
          color: drawColor,
          strokeWidth,
          cx: activeShapeStart.x,
          cy: activeShapeStart.y,
          radius: Math.sqrt(dx * dx + dy * dy)
        }
      } else if (drawTool === 'line') {
        newShape = {
          id: `line-${Date.now()}`,
          type: 'line',
          color: drawColor,
          strokeWidth,
          x1: activeShapeStart.x,
          y1: activeShapeStart.y,
          x2: activeShapeCurrent.x,
          y2: activeShapeCurrent.y
        }
      }

      if (newShape) {
        const updated = [...annotations, newShape]
        setAnnotations(updated)
        pushHistorySnapshot({ annotations: updated })
      }
      setActiveShapeStart(null)
      setActiveShapeCurrent(null)
    }
  }

  // UNDO & REDO
  const handleUndo = () => {
    if (historyIndex <= 0) return
    const prevIndex = historyIndex - 1
    const snapshot = historyStack[prevIndex]
    if (!snapshot) return

    isApplyingHistoryRef.current = true
    setBrightness(snapshot.brightness)
    setContrast(snapshot.contrast)
    setSaturation(snapshot.saturation)
    setExposure(snapshot.exposure)
    setActiveFilter(snapshot.activeFilter)
    setRotation(snapshot.rotation)
    setFlipH(snapshot.flipH)
    setFlipV(snapshot.flipV)
    setAnnotations(snapshot.annotations)
    if (snapshot.baseImageSrc !== currentBaseImageSrc) {
      setCurrentBaseImageSrc(snapshot.baseImageSrc)
      loadImage(snapshot.baseImageSrc, false)
    }
    setHistoryIndex(prevIndex)
    setTimeout(() => {
      isApplyingHistoryRef.current = false
    }, 50)
    showToast('Undo applied')
  }

  const handleRedo = () => {
    if (historyIndex >= historyStack.length - 1) return
    const nextIndex = historyIndex + 1
    const snapshot = historyStack[nextIndex]
    if (!snapshot) return

    isApplyingHistoryRef.current = true
    setBrightness(snapshot.brightness)
    setContrast(snapshot.contrast)
    setSaturation(snapshot.saturation)
    setExposure(snapshot.exposure)
    setActiveFilter(snapshot.activeFilter)
    setRotation(snapshot.rotation)
    setFlipH(snapshot.flipH)
    setFlipV(snapshot.flipV)
    setAnnotations(snapshot.annotations)
    if (snapshot.baseImageSrc !== currentBaseImageSrc) {
      setCurrentBaseImageSrc(snapshot.baseImageSrc)
      loadImage(snapshot.baseImageSrc, false)
    }
    setHistoryIndex(nextIndex)
    setTimeout(() => {
      isApplyingHistoryRef.current = false
    }, 50)
    showToast('Redo applied')
  }

  // Keyboard shortcut listener for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // ROTATION & FLIP
  const handleRotateCW = () => {
    const nextRotation = (rotation + 90) % 360
    setRotation(nextRotation)
    pushHistorySnapshot({ rotation: nextRotation })
    showToast(`Rotated to ${nextRotation}°`)
  }

  const handleRotateCCW = () => {
    const nextRotation = (rotation + 270) % 360
    setRotation(nextRotation)
    pushHistorySnapshot({ rotation: nextRotation })
    showToast(`Rotated to ${nextRotation}°`)
  }

  const handleToggleFlipH = () => {
    const nextVal = !flipH
    setFlipH(nextVal)
    pushHistorySnapshot({ flipH: nextVal })
    showToast(nextVal ? 'Flipped horizontally' : 'Horizontal flip removed')
  }

  const handleToggleFlipV = () => {
    const nextVal = !flipV
    setFlipV(nextVal)
    pushHistorySnapshot({ flipV: nextVal })
    showToast(nextVal ? 'Flipped vertically' : 'Vertical flip removed')
  }

  // CROP APPLICATION
  const handleApplyCrop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const pixelX = Math.round((cropBox.x / 100) * canvas.width)
    const pixelY = Math.round((cropBox.y / 100) * canvas.height)
    const pixelW = Math.round((cropBox.width / 100) * canvas.width)
    const pixelH = Math.round((cropBox.height / 100) * canvas.height)

    if (pixelW <= 10 || pixelH <= 10) {
      showToast('Crop area too small')
      return
    }

    // Temporary canvas to extract cropped region
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = pixelW
    cropCanvas.height = pixelH
    const cropCtx = cropCanvas.getContext('2d')

    // Draw current canvas slice into cropCanvas
    cropCtx.drawImage(canvas, pixelX, pixelY, pixelW, pixelH, 0, 0, pixelW, pixelH)

    const croppedDataUrl = cropCanvas.toDataURL('image/png')
    setCurrentBaseImageSrc(croppedDataUrl)
    loadImage(croppedDataUrl, false)

    // Reset rotation & adjustments since they are baked into the crop
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAnnotations([])
    setIsCropping(false)

    pushHistorySnapshot({
      baseImageSrc: croppedDataUrl,
      rotation: 0,
      flipH: false,
      flipV: false,
      annotations: [],
      naturalDimensions: { width: pixelW, height: pixelH }
    })

    showToast(`Cropped to ${pixelW} × ${pixelH} px`)
  }

  const handleSelectCropRatio = (id) => {
    setCropRatio(id)
    const preset = CROP_RATIOS.find((r) => r.id === id)
    if (!preset || !preset.ratio) {
      setCropBox({ x: 10, y: 10, width: 80, height: 80 })
      return
    }

    const r = preset.ratio
    let w = 80
    let h = 80 / r
    if (h > 90) {
      h = 80
      w = 80 * r
    }
    setCropBox({
      x: Math.max(5, (100 - w) / 2),
      y: Math.max(5, (100 - h) / 2),
      width: Math.min(90, w),
      height: Math.min(90, h)
    })
  }

  // RESIZE APPLICATION
  const handleApplyResize = () => {
    const targetW = parseInt(resizeWidth, 10)
    const targetH = parseInt(resizeHeight, 10)

    if (!targetW || !targetH || targetW < 32 || targetH < 32) {
      showToast('Please enter valid dimensions (min 32px)')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = document.createElement('canvas')
    resizeCanvas.width = targetW
    resizeCanvas.height = targetH
    const resizeCtx = resizeCanvas.getContext('2d')
    resizeCtx.imageSmoothingQuality = 'high'
    resizeCtx.drawImage(canvas, 0, 0, targetW, targetH)

    const resizedDataUrl = resizeCanvas.toDataURL('image/png')
    setCurrentBaseImageSrc(resizedDataUrl)
    loadImage(resizedDataUrl, false)

    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAnnotations([])

    pushHistorySnapshot({
      baseImageSrc: resizedDataUrl,
      rotation: 0,
      flipH: false,
      flipV: false,
      annotations: [],
      naturalDimensions: { width: targetW, height: targetH }
    })

    showToast(`Resized to ${targetW} × ${targetH} px`)
  }

  // RESET TO ORIGINAL IMAGE
  const handleConfirmReset = () => {
    setCurrentBaseImageSrc(originalImageSrc)
    loadImage(originalImageSrc, false)
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setExposure(0)
    setActiveFilter('normal')
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAnnotations([])
    setIsCropping(false)
    setZoomLevel(1.0)
    setPanOffset({ x: 0, y: 0 })
    setShowResetConfirm(false)

    // Clear history stack and re-seed
    const resetSnapshot = {
      baseImageSrc: originalImageSrc,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      exposure: 0,
      activeFilter: 'normal',
      rotation: 0,
      flipH: false,
      flipV: false,
      annotations: [],
      naturalDimensions
    }
    setHistoryStack([resetSnapshot])
    setHistoryIndex(0)
    showToast('Reset all edits to original image')
  }

  // FILE UPLOAD & DRAG-AND-DROP
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processSelectedFile(file)
    }
  }

  const processSelectedFile = (file) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setOriginalImageSrc(dataUrl)
      setCurrentBaseImageSrc(dataUrl)
      setImageName(file.name)
      loadImage(dataUrl, true)
      loadImage(dataUrl, false)

      // Reset adjustments & history
      setBrightness(100)
      setContrast(100)
      setSaturation(100)
      setExposure(0)
      setActiveFilter('normal')
      setRotation(0)
      setFlipH(false)
      setFlipV(false)
      setAnnotations([])
      setIsCropping(false)
      setZoomLevel(1.0)
      setPanOffset({ x: 0, y: 0 })

      setHistoryStack([])
      setHistoryIndex(-1)

      showToast(`Loaded "${file.name}"`)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processSelectedFile(file)
    }
  }

  // DOWNLOAD / EXPORT
  const handleDownloadEdited = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const mime = exportFormat || 'image/jpeg'
      const quality = mime === 'image/png' ? undefined : exportQuality
      const dataUrl = canvas.toDataURL(mime, quality)

      let ext = 'jpg'
      if (mime === 'image/png') ext = 'png'
      if (mime === 'image/webp') ext = 'webp'

      const cleanName = imageName.replace(/\.[^/.]+$/, '')
      const downloadName = `edited-${cleanName}.${ext}`

      const link = document.createElement('a')
      link.download = downloadName
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast(`Exported as ${ext.toUpperCase()} (${canvas.width} × ${canvas.height} px)`)
    } catch (err) {
      console.error('Export error:', err)
      showToast('Failed to export. Image may have cross-origin restrictions.')
    }
  }

  // Quick Text Alignment Helper
  const handleAddAlignedText = (position) => {
    const canvas = canvasRef.current
    if (!canvas) return

    let x = 40
    let y = 40
    if (position === 'center') {
      x = Math.max(20, canvas.width / 2 - 120)
      y = Math.max(20, canvas.height / 2 - 20)
    } else if (position === 'bottom-center') {
      x = Math.max(20, canvas.width / 2 - 120)
      y = Math.max(20, canvas.height - 80)
    } else if (position === 'bottom-right') {
      x = Math.max(20, canvas.width - 260)
      y = Math.max(20, canvas.height - 80)
    }

    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: textInput || 'Kiaan Studio',
      x,
      y,
      fontSize,
      color: textColor,
      fontFamily,
      bold: isBold,
      italic: isItalic
    }
    const updated = [...annotations, newText]
    setAnnotations(updated)
    pushHistorySnapshot({ annotations: updated })
    showToast('Text layer added')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* 1. Header (Eye-friendly Dark Slate Studio Theme) */}
      <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shrink-0">
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              Creation Studio
            </span>
            <span className="text-xs text-neutral-500 font-medium">/</span>
            <span className="text-xs text-neutral-400 font-medium truncate">Interactive Studio Canvas Editor</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            Image Canvas Editor
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            High-precision client-side photo studio: crop, rotate, flip, resize, tone adjustments, color grading, shapes, drawing, and typography overlays.
          </p>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs font-semibold rounded-xl flex items-center justify-between animate-fade-in shadow-lg">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            {notification}
          </span>
          <button
            onClick={() => setNotification('')}
            className="text-cyan-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Main Studio Grid: Tools (4 cols) + Canvas (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Side: Interactive Tools Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          {/* Tool Navigation Tabs */}
          <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-1.5 border border-neutral-800/90 shadow-sm grid grid-cols-5 gap-1 text-center">
            {[
              { id: 'adjust', label: 'Adjust', icon: Sliders },
              { id: 'filter', label: 'Filters', icon: Palette },
              { id: 'crop', label: 'Transform', icon: Crop },
              { id: 'draw', label: 'Draw', icon: Brush },
              { id: 'text', label: 'Text', icon: Type }
            ].map((tab) => {
              const IconComp = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id !== 'crop' && isCropping) {
                      setIsCropping(false)
                    }
                  }}
                  className={cn(
                    'py-2 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  )}
                >
                  <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="truncate text-[11px]">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB 1: Adjustments (Brightness, Contrast, Saturation, Exposure) */}
          {activeTab === 'adjust' && (
            <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Color & Tone Adjustments
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setBrightness(100)
                    setContrast(100)
                    setSaturation(100)
                    setExposure(0)
                    pushHistorySnapshot({ brightness: 100, contrast: 100, saturation: 100, exposure: 0 })
                    showToast('Adjustments reset')
                  }}
                  className="text-xs text-neutral-400 hover:text-cyan-300 cursor-pointer"
                >
                  Reset Sliders
                </button>
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-neutral-400" />
                    Brightness
                  </span>
                  <span className="font-mono text-cyan-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  onMouseUp={() => pushHistorySnapshot()}
                  onTouchEnd={() => pushHistorySnapshot()}
                  className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-neutral-400" />
                    Contrast
                  </span>
                  <span className="font-mono text-cyan-400">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                  onMouseUp={() => pushHistorySnapshot()}
                  onTouchEnd={() => pushHistorySnapshot()}
                  className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-300">
                  <span>Saturation</span>
                  <span className="font-mono text-cyan-400">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                  onMouseUp={() => pushHistorySnapshot()}
                  onTouchEnd={() => pushHistorySnapshot()}
                  className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Exposure */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-300">
                  <span>Exposure Offset</span>
                  <span className="font-mono text-cyan-400">{exposure > 0 ? `+${exposure}` : exposure}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={exposure}
                  onChange={(e) => setExposure(parseInt(e.target.value, 10))}
                  onMouseUp={() => pushHistorySnapshot()}
                  onTouchEnd={() => pushHistorySnapshot()}
                  className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Photographic Filters */}
          {activeTab === 'filter' && (
            <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                Color Grading Presets
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                {PRESET_FILTERS.map((f) => {
                  const isSelected = activeFilter === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setActiveFilter(f.id)
                        pushHistorySnapshot({ activeFilter: f.id })
                      }}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/20 font-bold'
                          : 'border-neutral-800 bg-[#080B14] hover:border-cyan-500/60 text-neutral-300'
                      )}
                    >
                      <div className="text-xs">{f.name}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Crop, Rotate & Resize */}
          {activeTab === 'crop' && (
            <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Crop className="w-4 h-4 text-cyan-400" />
                Orientation & Framing
              </h2>

              {/* Rotation & Flip Actions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 block">Rotate & Flip</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={handleRotateCCW}
                    className="p-2 rounded-lg border border-neutral-700 bg-[#080B14] hover:bg-neutral-800 text-neutral-300 hover:text-white flex flex-col items-center gap-1 cursor-pointer"
                    title="Rotate 90° CCW"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[10px]">-90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRotateCW}
                    className="p-2 rounded-lg border border-neutral-700 bg-[#080B14] hover:bg-neutral-800 text-neutral-300 hover:text-white flex flex-col items-center gap-1 cursor-pointer"
                    title="Rotate 90° CW"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="text-[10px]">+90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleFlipH}
                    className={cn(
                      'p-2 rounded-lg border transition-all flex flex-col items-center gap-1 cursor-pointer',
                      flipH ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-neutral-700 bg-[#080B14] text-neutral-300 hover:bg-neutral-800'
                    )}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Flip H</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleFlipV}
                    className={cn(
                      'p-2 rounded-lg border transition-all flex flex-col items-center gap-1 cursor-pointer',
                      flipV ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-neutral-700 bg-[#080B14] text-neutral-300 hover:bg-neutral-800'
                    )}
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Flip V</span>
                  </button>
                </div>
              </div>

              {/* Crop Ratio Presets & Mode */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Crop Tool</label>
                  <button
                    type="button"
                    onClick={() => setIsCropping(!isCropping)}
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors',
                      isCropping ? 'bg-cyan-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    )}
                  >
                    {isCropping ? 'Exit Crop' : 'Enter Crop Mode'}
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {CROP_RATIOS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setIsCropping(true)
                        handleSelectCropRatio(c.id)
                      }}
                      className={cn(
                        'p-1.5 rounded-lg border text-[10px] font-semibold text-center transition-all cursor-pointer',
                        cropRatio === c.id && isCropping
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-neutral-800 bg-[#080B14] hover:bg-neutral-800 text-neutral-400'
                      )}
                    >
                      {c.id}
                    </button>
                  ))}
                </div>

                {isCropping && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyCrop}
                      leftIcon={Check}
                      className="w-full text-xs font-bold"
                    >
                      Apply Crop
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCropping(false)}
                      className="text-xs border-neutral-700"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Pixel Resize Controls */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Pixel Resize</label>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Current: {naturalDimensions.width} × {naturalDimensions.height} px
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">Width</span>
                    <input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0
                        setResizeWidth(val)
                        if (maintainAspect && naturalDimensions.width > 0) {
                          const aspect = naturalDimensions.height / naturalDimensions.width
                          setResizeHeight(Math.round(val * aspect))
                        }
                      }}
                      className="w-full bg-[#080B14] border border-neutral-700 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-0.5">Height</span>
                    <input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0
                        setResizeHeight(val)
                        if (maintainAspect && naturalDimensions.height > 0) {
                          const aspect = naturalDimensions.width / naturalDimensions.height
                          setResizeWidth(Math.round(val * aspect))
                        }
                      }}
                      className="w-full bg-[#080B14] border border-neutral-700 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e) => setMaintainAspect(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                    Lock aspect ratio
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyResize}
                    className="text-xs border-neutral-700 hover:text-white"
                  >
                    Apply Resize
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Draw & Annotate */}
          {activeTab === 'draw' && (
            <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Brush className="w-4 h-4 text-cyan-400" />
                  Drawing & Shapes
                </h2>
                {annotations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnnotations([])
                      pushHistorySnapshot({ annotations: [] })
                      showToast('Drawings cleared')
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Tool Type Selector */}
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: 'brush', label: 'Brush', icon: Brush },
                  { id: 'eraser', label: 'Eraser', icon: Eraser },
                  { id: 'line', label: 'Line', icon: Minus },
                  { id: 'rect', label: 'Rect', icon: Square },
                  { id: 'circle', label: 'Circle', icon: Circle }
                ].map((tool) => {
                  const Icon = tool.icon
                  const isSelected = drawTool === tool.id
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setDrawTool(tool.id)}
                      className={cn(
                        'p-2 rounded-xl border text-[10px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/20'
                          : 'border-neutral-800 bg-[#080B14] text-neutral-400 hover:text-white'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tool.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Stroke Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-300">
                  <span>Stroke Size</span>
                  <span className="font-mono text-cyan-400">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Color Swatches */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-neutral-300 block">Color</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setDrawColor(swatch)}
                      style={{ backgroundColor: swatch }}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer',
                        drawColor === swatch ? 'border-cyan-400 scale-110 shadow-md' : 'border-neutral-700'
                      )}
                    />
                  ))}
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border border-neutral-700 bg-transparent p-0"
                    title="Custom hex color"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Text Overlay */}
          {activeTab === 'text' && (
            <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Type className="w-4 h-4 text-cyan-400" />
                Text & Typography
              </h2>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">Text Content</label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text overlay..."
                  className="w-full bg-[#080B14] border border-neutral-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              {/* Font Size & Styling */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-neutral-300 block">Size: {fontSize}px</span>
                  <input
                    type="range"
                    min="14"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-neutral-300 block">Format</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBold(!isBold)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer',
                        isBold ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-neutral-700 bg-[#080B14] text-neutral-400'
                      )}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsItalic(!isItalic)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs italic cursor-pointer',
                        isItalic ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-neutral-700 bg-[#080B14] text-neutral-400'
                      )}
                    >
                      I
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-neutral-300 block">Text Color</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setTextColor(swatch)}
                      style={{ backgroundColor: swatch }}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer',
                        textColor === swatch ? 'border-cyan-400 scale-110 shadow-md' : 'border-neutral-700'
                      )}
                    />
                  ))}
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border border-neutral-700 bg-transparent p-0"
                  />
                </div>
              </div>

              {/* Quick Placement Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <span className="text-xs font-semibold text-neutral-300 block">Add to Position</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddAlignedText('top-left')}
                    className="p-1.5 rounded-lg border border-neutral-700 bg-[#080B14] hover:bg-neutral-800 text-[11px] text-neutral-300 cursor-pointer"
                  >
                    Top Left
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAlignedText('center')}
                    className="p-1.5 rounded-lg border border-neutral-700 bg-[#080B14] hover:bg-neutral-800 text-[11px] text-neutral-300 cursor-pointer"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAlignedText('bottom-right')}
                    className="p-1.5 rounded-lg border border-neutral-700 bg-[#080B14] hover:bg-neutral-800 text-[11px] text-neutral-300 cursor-pointer"
                  >
                    Bottom Right
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload / Replace Image Box (Clean well matching current dark premium theme) */}
          <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-neutral-800/90 shadow-sm space-y-3 text-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-200">Current File:</span>
              <span className="font-mono text-neutral-400 truncate max-w-[150px]">{imageName}</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Resolution:</span>
              <span className="font-mono text-cyan-300">
                {naturalDimensions.width} × {naturalDimensions.height} px
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={Upload}
              className="w-full text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white cursor-pointer"
            >
              Upload / Replace Image
            </Button>
            <p className="text-[10px] text-neutral-500 text-center">
              PNG, JPG, or WebP up to 25MB • Drag-and-drop supported
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Editing Canvas Viewport (8 cols) */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          <div className="bg-[#0D111C]/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-neutral-800/90 shadow-sm space-y-4 text-neutral-100">
            {/* Top Viewport Control Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-100">Live Studio Viewport</span>
                <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700/60 font-mono">
                  {naturalDimensions.width} × {naturalDimensions.height} px
                </span>
                {rotation !== 0 && (
                  <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                    {rotation}°
                  </span>
                )}
                {activeFilter !== 'normal' && (
                  <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                    {activeFilter}
                  </span>
                )}
              </div>

              {/* Viewport Actions: Undo, Redo, Compare & Zoom */}
              <div className="flex items-center gap-2">
                {/* Undo */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={cn(
                    'p-1.5 rounded-lg border transition-colors cursor-pointer',
                    historyIndex > 0
                      ? 'border-neutral-700 bg-neutral-800/80 text-neutral-200 hover:text-white hover:bg-neutral-700'
                      : 'border-neutral-800/60 bg-neutral-900/60 text-neutral-600 cursor-not-allowed'
                  )}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>

                {/* Redo */}
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  className={cn(
                    'p-1.5 rounded-lg border transition-colors cursor-pointer',
                    historyIndex < historyStack.length - 1
                      ? 'border-neutral-700 bg-neutral-800/80 text-neutral-200 hover:text-white hover:bg-neutral-700'
                      : 'border-neutral-800/60 bg-neutral-900/60 text-neutral-600 cursor-not-allowed'
                  )}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>

                {/* Compare with Original (Before / After) */}
                <button
                  type="button"
                  onMouseDown={() => setIsShowingBefore(true)}
                  onMouseUp={() => setIsShowingBefore(false)}
                  onTouchStart={() => setIsShowingBefore(true)}
                  onTouchEnd={() => setIsShowingBefore(false)}
                  onClick={() => setIsShowingBefore(!isShowingBefore)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all',
                    isShowingBefore
                      ? 'border-cyan-400 bg-cyan-950 text-cyan-300 ring-2 ring-cyan-500/30'
                      : 'border-neutral-700 bg-neutral-800/80 text-neutral-300 hover:text-white'
                  )}
                  title="Hold or toggle to compare with original image"
                >
                  {isShowingBefore ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isShowingBefore ? 'Original' : 'Compare'}</span>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden bg-neutral-900 text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                    className="p-1 px-2 hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono text-[11px] text-neutral-400">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3.0, Number((z + 0.25).toFixed(2))))}
                    className="p-1 px-2 hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(1.0)
                      setPanOffset({ x: 0, y: 0 })
                    }}
                    className="p-1 px-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white border-l border-neutral-800 cursor-pointer"
                    title="Fit to screen (100%)"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Viewport Container (with drag-and-drop & cursor states) */}
            <div
              ref={containerRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative w-full rounded-2xl overflow-hidden bg-[#05070E] border transition-all flex items-center justify-center min-h-[380px] sm:min-h-[460px] max-h-[580px] p-2 sm:p-4 select-none',
                isDragOver ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-500/40' : 'border-neutral-800',
                activeTab === 'draw' && 'cursor-crosshair',
                activeTab === 'text' && 'cursor-text',
                isCropping && 'cursor-move'
              )}
            >
              {/* Actual HTML5 Working Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transition: isDrawing ? 'none' : 'transform 0.15s ease-out',
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
                className="shadow-2xl rounded-lg"
              />

              {/* Drag & Drop Visual Indicator Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 bg-[#06080F]/85 backdrop-blur-xs flex flex-col items-center justify-center text-cyan-300 space-y-2 pointer-events-none z-30">
                  <Upload className="w-10 h-10 animate-bounce text-cyan-400" />
                  <p className="text-sm font-bold">Drop Image to Load in Studio</p>
                  <p className="text-xs text-neutral-400">PNG, JPG, or WebP</p>
                </div>
              )}
            </div>

            {/* Bottom Viewport Action Bar: Reset (Left) & Export Options (Right) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  leftIcon={RotateCcw}
                  className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white cursor-pointer text-xs"
                >
                  Reset
                </Button>
                <span className="text-xs text-neutral-500 hidden sm:inline">
                  {historyIndex > 0 ? `${historyIndex} edits applied` : 'Original state'}
                </span>
              </div>

              {/* Export Format & Download */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="bg-[#080B14] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="image/png">PNG (Lossless)</option>
                  <option value="image/jpeg">JPEG (Photo)</option>
                  <option value="image/webp">WebP (Modern)</option>
                </select>

                {exportFormat !== 'image/png' && (
                  <select
                    value={exportQuality}
                    onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                    className="bg-[#080B14] border border-neutral-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value={0.95}>High (95%)</option>
                    <option value={0.85}>Medium (85%)</option>
                    <option value={0.75}>Compact (75%)</option>
                  </select>
                )}

                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleDownloadEdited}
                  leftIcon={Download}
                  className="shadow-md font-semibold cursor-pointer text-xs sm:text-sm py-2 px-4"
                >
                  Download Edited
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <Modal
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          title="Reset All Edits?"
          description="Confirm reverting changes back to the original image"
          theme="dark"
          className="max-w-md bg-[#0D111C] text-neutral-100 border-neutral-800"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                This will discard all tone adjustments, rotations, crops, drawing annotations, and typography layers, restoring the pristine original image.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
                className="text-neutral-300 border-neutral-700 hover:bg-neutral-800"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReset}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Reset to Original
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ImageEditorPage
