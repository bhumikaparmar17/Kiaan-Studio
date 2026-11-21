import fs from 'fs'
import path from 'path'
import { env } from '../../config/env.js'
import { logger } from '../../utils/logger.js'

export const CLOUDFLARE_MODELS = {
  'flux-2-klein-4b': {
    cfModel: '@cf/black-forest-labs/flux-2-klein-4b',
    format: 'multipart',
    defaultSteps: 4,
    defaultDimensions: { width: 1024, height: 1024 }
  },
  'flux-1-schnell': {
    cfModel: '@cf/black-forest-labs/flux-1-schnell',
    format: 'json',
    defaultSteps: 4,
    defaultDimensions: { width: 1024, height: 1024 }
  }
}

const ASPECT_RATIO_MAP = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '21:9': { width: 1024, height: 448 }
}

export class CloudflareAiService {
  /**
   * Check if Cloudflare credentials are configured in environment
   */
  static isConfigured() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID
    const token = process.env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN
    return Boolean(accountId && token && accountId.trim() && token.trim())
  }

  /**
   * Get credentials securely
   */
  static getCredentials() {
    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID || '').trim()
    const token = (process.env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN || '').trim()
    if (!accountId || !token) {
      throw new Error('[Cloudflare AI Error] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in backend environment.')
    }
    return { accountId, token }
  }

  /**
   * Parse width and height from parameters or aspect ratio
   */
  static parseDimensions(aspect = '1:1', rawWidth = null, rawHeight = null) {
    const cleanAspect = String(aspect || '1:1').trim()
    const ratioMatch = cleanAspect.match(/(\d+)\s*:\s*(\d+)/)
    const ratioKey = ratioMatch ? `${ratioMatch[1]}:${ratioMatch[2]}` : cleanAspect
    if (ASPECT_RATIO_MAP[ratioKey]) {
      return ASPECT_RATIO_MAP[ratioKey]
    }
    if (ASPECT_RATIO_MAP[cleanAspect]) {
      return ASPECT_RATIO_MAP[cleanAspect]
    }
    if (rawWidth && rawHeight) {
      return {
        width: Math.min(1024, Math.max(256, parseInt(rawWidth, 10) || 1024)),
        height: Math.min(1024, Math.max(256, parseInt(rawHeight, 10) || 1024))
      }
    }
    return { width: 1024, height: 1024 }
  }

  /**
   * Execute real image generation via Cloudflare Workers AI
   */
  static async generateImage({ modelId, prompt, parameters = {}, jobId = 'default' }) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error('[Cloudflare AI Error] Prompt is required for image generation.')
    }

    const modelConfig = CLOUDFLARE_MODELS[modelId]
    if (!modelConfig) {
      throw new Error(`[Cloudflare AI Error] Model '${modelId}' is not configured for Cloudflare inference. Supported: ${Object.keys(CLOUDFLARE_MODELS).join(', ')}`)
    }

    const { accountId, token } = this.getCredentials()
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelConfig.cfModel}`
    const dims = this.parseDimensions(parameters.aspect || parameters.aspectRatio, parameters.width, parameters.height)

    const startTime = Date.now()
    logger.info(`[Cloudflare AI] Calling model ${modelConfig.cfModel} for Job #${jobId}...`)

    let response
    try {
      if (modelConfig.format === 'multipart') {
        // FLUX.2 Klein 4B: strictly multipart/form-data
        const formData = new FormData()
        formData.append('prompt', prompt.trim())
        formData.append('width', String(dims.width))
        formData.append('height', String(dims.height))

        if (parameters.seed !== undefined && parameters.seed !== null && parameters.seed !== '') {
          const parsedSeed = parseInt(parameters.seed, 10)
          if (!isNaN(parsedSeed)) {
            formData.append('seed', String(parsedSeed))
          }
        }

        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        })
      } else {
        // FLUX.1 Schnell: application/json with prompt, steps (strictly NO seed, NO num_steps)
        const steps = Math.min(8, Math.max(1, parseInt(parameters.steps, 10) || modelConfig.defaultSteps))
        const bodyObj = {
          prompt: prompt.trim(),
          steps
        }

        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyObj)
        })
      }
    } catch (networkErr) {
      logger.error(`[Cloudflare AI] Network request failed: ${networkErr.message}`)
      throw new Error(`[Cloudflare AI Network Error] Failed to reach Cloudflare Workers AI API: ${networkErr.message}`)
    }

    const latencyMs = Date.now() - startTime

    // Handle HTTP error statuses
    if (response.status === 401) {
      throw new Error('[Cloudflare AI Error] Authentication failed (HTTP 401). Verify CLOUDFLARE_API_TOKEN in backend/.env.')
    }
    if (response.status === 429) {
      throw new Error('[Cloudflare AI Error] Rate limit exceeded (HTTP 429). Cloudflare Workers AI capacity temporarily exhausted.')
    }
    if (!response.ok) {
      let errText = ''
      try {
        const errJson = await response.json()
        errText = errJson.errors?.[0]?.message || errJson.error || JSON.stringify(errJson)
      } catch {
        errText = await response.text()
      }

      // Check specifically for Cloudflare's provider-side output moderation flag
      const isOutputFlagged = /flagged|content moderation|safety/i.test(errText)
      if (isOutputFlagged) {
        logger.warn(`[Cloudflare AI] Job #${jobId} flagged by provider safety filter (HTTP ${response.status})`)
        const flaggedError = new Error('The AI safety filter flagged the generated output for this prompt. Please try a different description or prompt variation.')
        flaggedError.code = 'CONTENT_OUTPUT_FLAGGED'
        flaggedError.statusCode = 400
        flaggedError.isFlagged = true
        throw flaggedError
      }

      throw new Error(`[Cloudflare AI Error] API request failed with HTTP ${response.status}: ${errText}`)
    }

    // Decode image response (JSON base64 or direct binary)
    let imageBuffer
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const resultJson = await response.json()
      if (resultJson.success === false && !resultJson.result) {
        const msg = resultJson.errors?.[0]?.message || 'Cloudflare returned unsuccessful status'
        if (/flagged|content moderation|safety/i.test(msg)) {
          logger.warn(`[Cloudflare AI] Job #${jobId} flagged by provider safety filter in JSON response`)
          const flaggedError = new Error('The AI safety filter flagged the generated output for this prompt. Please try a different description or prompt variation.')
          flaggedError.code = 'CONTENT_OUTPUT_FLAGGED'
          flaggedError.statusCode = 400
          flaggedError.isFlagged = true
          throw flaggedError
        }
        throw new Error(`[Cloudflare AI Error] ${msg}`)
      }

      const b64Data = resultJson.result?.image || resultJson.image
      if (!b64Data || typeof b64Data !== 'string') {
        throw new Error('[Cloudflare AI Error] Response JSON missing valid base64 image data.')
      }

      const cleanB64 = b64Data.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(cleanB64, 'base64')
    } else {
      const arrayBuffer = await response.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    }

    if (!imageBuffer || imageBuffer.length < 100) {
      throw new Error('[Cloudflare AI Error] Received empty or corrupted image data from Cloudflare.')
    }

    // Save image asset to backend/uploads/generations
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'generations')
    fs.mkdirSync(uploadsDir, { recursive: true })

    const fileName = `gen_${jobId}_${Date.now()}.jpg`
    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, imageBuffer)

    const storagePath = `/uploads/generations/${fileName}`
    logger.info(`[Cloudflare AI] Image successfully synthesized and saved: ${storagePath} (${imageBuffer.length} bytes in ${latencyMs}ms)`)

    return {
      storagePath,
      thumbnailPath: storagePath,
      dimensions: `${dims.width}x${dims.height}`,
      fileSizeBytes: imageBuffer.length,
      mediaType: 'IMAGE',
      executionTimeMs: latencyMs,
      modelId,
      cfModel: modelConfig.cfModel
    }
  }
}

export default CloudflareAiService
