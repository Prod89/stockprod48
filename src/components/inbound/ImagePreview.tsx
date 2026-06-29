'use client'

import { cn } from '@/lib/utils/cn'
import { formatFileSize } from '@/lib/utils/image-compression'

interface ImageFile {
  file: File
  preview: string
  compressed?: File
}

interface ImagePreviewProps {
  images: ImageFile[]
  onRemove: (index: number) => void
  className?: string
}

export function ImagePreview({ images, onRemove, className }: ImagePreviewProps) {
  if (images.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/70">
          รูปภาพ ({images.length})
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={`รูปสินค้า ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ opacity: 1 }} // Always visible on mobile
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* File size info */}
            <div className="absolute bottom-1 left-1 right-1">
              <div className="bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-center">
                <p className="text-[9px] text-white/80 truncate">
                  {img.compressed
                    ? `${formatFileSize(img.file.size)} → ${formatFileSize(img.compressed.size)}`
                    : formatFileSize(img.file.size)
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { ImageFile }
