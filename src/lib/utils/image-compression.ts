import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // Max 500KB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
}

export async function compressImage(file: File): Promise<File> {
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)
    console.log(
      `Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`
    )
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    // Return original file if compression fails
    return file
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
