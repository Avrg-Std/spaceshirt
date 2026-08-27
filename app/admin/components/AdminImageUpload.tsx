'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

type AdminImageUploadProps = {
  name?: string
  defaultValue?: string
}

export default function AdminImageUpload({
  name = 'image',
  defaultValue = '',
}: AdminImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue)
  const [manualUrl, setManualUrl] = useState(defaultValue)
  const [showManualUrl, setShowManualUrl] = useState(Boolean(defaultValue))
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setImageUrl(defaultValue)
    setManualUrl(defaultValue)
    setShowManualUrl(Boolean(defaultValue))
  }, [defaultValue])

  async function uploadFile(file: File) {
    setError('')

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File too large. Maximum size is 5 MB.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Upload failed')
      }

      if (!data.url) {
        throw new Error('Upload did not return an image URL')
      }

      setImageUrl(data.url)
      setManualUrl(data.url)
      setShowManualUrl(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileSelection(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    void uploadFile(file)
  }

  function applyManualUrl() {
    setError('')
    const trimmed = manualUrl.trim()
    if (!trimmed) {
      setImageUrl('')
      return
    }

    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid URL')
      }
      setImageUrl(trimmed)
    } catch {
      setError('Enter a valid http or https image URL.')
    }
  }

  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
        Product Image
      </label>

      <input type="hidden" name={name} value={imageUrl} />

      <div
        className={`rounded-xl border-2 border-dashed p-6 transition-colors ${
          dragActive ? 'border-black bg-neutral-50' : 'border-black/10 bg-neutral-50'
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          handleFileSelection(event.dataTransfer.files)
        }}
      >
        {imageUrl ? (
          <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden border border-black/10 bg-white mb-4">
            <Image
              src={imageUrl}
              alt="Product preview"
              fill
              className="object-contain p-2"
              unoptimized={imageUrl.startsWith('/')}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-600 mb-4">
            Drag and drop an image here, or choose a file to upload to Cloudinary.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <label className="px-4 py-2 bg-black text-white font-bebas tracking-wide rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors cursor-pointer">
            {uploading ? 'UPLOADING...' : 'CHOOSE FILE'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(event) => handleFileSelection(event.target.files)}
            />
          </label>

          {imageUrl ? (
            <button
              type="button"
              onClick={() => {
                setImageUrl('')
                setManualUrl('')
              }}
              className="px-4 py-2 bg-neutral-200 font-bebas tracking-wide rounded-xl hover:bg-neutral-300 transition-colors"
            >
              REMOVE
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowManualUrl((current) => !current)}
          className="text-sm font-semibold text-neutral-600 hover:text-black"
        >
          {showManualUrl ? 'Hide manual URL' : 'Or paste image URL'}
        </button>

        {showManualUrl ? (
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="https://..."
              className="flex-1 px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
            />
            <button
              type="button"
              onClick={applyManualUrl}
              className="px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl font-bebas tracking-wide hover:bg-neutral-200 transition-colors"
            >
              USE URL
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
          {error}
        </p>
      ) : null}
    </div>
  )
}
