import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, Download, Settings, Info, Image as ImageIcon, X, Package, Trash2, Crop, Bookmark } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useToolStore, IconName } from '../store/useToolStore'
import { useI18n } from '../i18n/context'
import BookmarkConverter from '../components/tools/BookmarkConverter'

const iconMap: Record<IconName, React.ReactNode> = {
  image: <ImageIcon className="h-6 w-6" />,
  crop: <Crop className="h-6 w-6" />,
  bookmark: <Bookmark className="h-6 w-6" />
}

interface ImageItem {
  id: string
  file: File
  fileName: string
  originalSize: number
  compressedSize: number
  previewUrl: string
  compressedUrl: string
  status: 'pending' | 'compressing' | 'done' | 'error'
  errorMsg: string
}

function ToolDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const tools = useToolStore(state => state.tools)
  const tool = tools.find(t => t.id === id)
  const [compressionQuality, setCompressionQuality] = useState(80)
  const [compressError, setCompressError] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [isBatchCompressing, setIsBatchCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qualityRef = useRef(compressionQuality)

  useEffect(() => {
    qualityRef.current = compressionQuality
  }, [compressionQuality])

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const revokeAllUrls = useCallback((items: ImageItem[]) => {
    items.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl)
    })
  }, [])

  useEffect(() => {
    return () => {
      revokeAllUrls(images)
    }
  }, [])

  const createImageItem = (file: File): ImageItem => ({
    id: generateId(),
    file,
    fileName: file.name,
    originalSize: file.size,
    compressedSize: 0,
    previewUrl: URL.createObjectURL(file),
    compressedUrl: '',
    status: 'pending',
    errorMsg: ''
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length < files.length) {
      setCompressError(t.imageCompressor.errorFilter)
    } else {
      setCompressError('')
    }

    const newItems = validFiles.map(createImageItem)
    setImages(prev => [...prev, ...newItems])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return

    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length < files.length) {
      setCompressError(t.imageCompressor.errorFilter)
    } else {
      setCompressError('')
    }

    const newItems = validFiles.map(createImageItem)
    setImages(prev => [...prev, ...newItems])
  }

  const compressSingleImage = useCallback((item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      const currentPreviewUrl = URL.createObjectURL(item.file)
      const currentQuality = qualityRef.current

      img.onload = () => {
        URL.revokeObjectURL(currentPreviewUrl)
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        const outputType = item.file.type === 'image/png' ? 'image/jpeg' : item.file.type

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedUrl = URL.createObjectURL(blob)
            resolve({
              ...item,
              compressedSize: blob.size,
              compressedUrl,
              status: 'done',
              errorMsg: ''
            })
          } else {
            resolve({
              ...item,
              status: 'error',
              errorMsg: t.imageCompressor.errorCompress
            })
          }
        }, outputType, currentQuality / 100)
      }

      img.onerror = () => {
        URL.revokeObjectURL(currentPreviewUrl)
        resolve({
          ...item,
          status: 'error',
          errorMsg: t.imageCompressor.errorLoad
        })
      }

      img.src = currentPreviewUrl
    })
  }, [])

  const compressAllImages = useCallback(async () => {
    const currentImages = images
    const pendingImages = currentImages.filter(img => img.status === 'pending')
    if (pendingImages.length === 0) return

    setIsBatchCompressing(true)
    setCompressError('')

    for (const item of pendingImages) {
      setImages(prev => prev.map(img =>
        img.id === item.id ? { ...img, status: 'compressing' } : img
      ))

      const result = await compressSingleImage(item)

      setImages(prev => prev.map(img =>
        img.id === item.id ? result : img
      ))
    }

    setIsBatchCompressing(false)
  }, [images, compressSingleImage])

  const downloadSingleImage = (item: ImageItem) => {
    if (!item.compressedUrl) return
    const extension = item.file.type === 'image/png' ? 'jpg' : item.file.type.split('/')[1] || 'jpg'
    const fileNameWithoutExt = item.fileName.replace(/\.[^/.]+$/, "")
    const downloadFileName = `compressed_${fileNameWithoutExt}.${extension}`

    const link = document.createElement('a')
    link.href = item.compressedUrl
    link.download = downloadFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllImages = useCallback(async () => {
    const doneImages = images.filter(img => img.status === 'done' && img.compressedUrl)
    if (doneImages.length === 0) return

    if (doneImages.length === 1) {
      downloadSingleImage(doneImages[0])
      return
    }

    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      for (const item of doneImages) {
        const response = await fetch(item.compressedUrl)
        const blob = await response.blob()
        const extension = item.file.type === 'image/png' ? 'jpg' : item.file.type.split('/')[1] || 'jpg'
        const fileNameWithoutExt = item.fileName.replace(/\.[^/.]+$/, "")
        zip.file(`compressed_${fileNameWithoutExt}.${extension}`, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'compressed_images.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setCompressError(t.imageCompressor.errorDownload)
      console.error('Download all error:', err)
    }
  }, [images])

  const removeImage = (id: string) => {
    setImages(prev => {
      const item = prev.find(img => img.id === id)
      if (item) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const clearAllImages = () => {
    revokeAllUrls(images)
    setImages([])
    setCompressError('')
  }

  const getCompressionRatio = (original: number, compressed: number) => {
    if (!original || !compressed) return 0
    return Math.round((1 - compressed / original) * 100)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
  const totalCompressedSize = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0)
  const doneCount = images.filter(img => img.status === 'done').length
  const pendingCount = images.filter(img => img.status === 'pending').length

  if (!tool) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-8">
        <div className="text-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">{t.toolDetail.notFoundTitle}</h1>
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t.toolDetail.notFoundLink}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center mb-8 text-sm">
        <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.toolDetail.breadcrumbHome}
        </Link>
        <span className="text-gray-300">/</span>
        <Link to="/categories" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mx-4">
          {t.toolDetail.breadcrumbCategories}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="mx-4 text-gray-900 font-medium">{tool.id === 'image-compressor' ? t.tools.imageCompressor : tool.id === 'image-cropper' ? t.tools.imageCropper : tool.id === 'bookmark-converter' ? t.tools.bookmarkConverter : tool.title}</span>
      </div>

      {/* Tool Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-gray-100 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 flex-shrink-0">
            {iconMap[tool.iconName]}
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{tool.id === 'image-compressor' ? t.tools.imageCompressor : tool.id === 'image-cropper' ? t.tools.imageCropper : tool.id === 'bookmark-converter' ? t.tools.bookmarkConverter : tool.title}</h1>
            <div className="inline-block px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-4">
              {tool.id === 'image-compressor' ? t.tools.designTool : tool.id === 'image-cropper' ? t.tools.designTool : tool.id === 'bookmark-converter' ? t.tools.efficiencyTool : tool.category}
            </div>
            <p className="text-gray-600 text-lg">{tool.id === 'image-compressor' ? t.tools.imageCompressorDesc : tool.id === 'image-cropper' ? t.tools.imageCropperDesc : tool.id === 'bookmark-converter' ? t.tools.bookmarkConverterDesc : tool.description}</p>
          </div>
        </div>
      </div>

      {/* Tool Content - 图片压缩工具 */}
      {tool.id === 'image-compressor' && (
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 animate-fade-in">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-6 flex items-center text-gray-900">
              <Settings className="h-6 w-6 text-gray-600 mr-2" />
              {t.imageCompressor.title}
            </h3>

            {/* Drop Zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-gray-400 transition-colors duration-200"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 mx-auto mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <p className="text-gray-600 mb-4">{t.imageCompressor.dropzone}</p>
              <input
                type="file"
                className="hidden"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <label
                htmlFor="image-upload"
                className="btn-primary cursor-pointer inline-block"
              >
                {t.imageCompressor.uploadBtn}
              </label>
            </div>
            {compressError && (
              <p className="text-red-500 text-sm mt-2">{compressError}</p>
            )}
          </div>

          {/* Image List */}
          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {t.imageCompressor.heading} {t.imageCompressor.imageCount.replace('{count}', String(images.length))}
                </h4>
                <button
                  onClick={clearAllImages}
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors duration-200 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.imageCompressor.clearAll}
                </button>
              </div>

              {/* Stats */}
              {doneCount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {t.imageCompressor.completed}: <span className="font-medium text-gray-900">{doneCount}/{images.length}</span>
                    </span>
                    <span className="text-gray-600">
                      {t.imageCompressor.originalSize}: <span className="font-medium text-gray-900">{formatFileSize(totalOriginalSize)}</span>
                    </span>
                    <span className="text-gray-600">
                      {t.imageCompressor.compressedSize}: <span className="font-medium text-gray-900">{formatFileSize(totalCompressedSize)}</span>
                    </span>
                    {totalOriginalSize > 0 && totalCompressedSize > 0 && (
                      <span className="text-green-600 font-medium">
                        {t.imageCompressor.reduced} {getCompressionRatio(totalOriginalSize, totalCompressedSize)}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 flex items-center gap-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.previewUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(item.originalSize)}</p>
                      {item.status === 'done' && (
                        <p className="text-xs text-green-600">
                          {t.imageCompressor.compressedTo}: {formatFileSize(item.compressedSize)} ({t.imageCompressor.reducedBy} {getCompressionRatio(item.originalSize, item.compressedSize)}%)
                        </p>
                      )}
                      {item.status === 'error' && (
                        <p className="text-xs text-red-500">{item.errorMsg}</p>
                      )}
                      {item.status === 'compressing' && (
                        <p className="text-xs text-gray-500">{t.imageCompressor.compressing}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === 'done' && item.compressedUrl && (
                        <button
                          onClick={() => downloadSingleImage(item)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title={t.imageCompressor.download}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title={t.imageCompressor.delete}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compression Settings */}
          {images.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-4 flex items-center text-gray-900">
                <Settings className="h-5 w-5 text-gray-600 mr-2" />
                {t.imageCompressor.settings}
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-gray-700">{t.imageCompressor.quality}</label>
                    <span className="text-gray-900 font-medium">{compressionQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={compressionQuality}
                    onChange={(e) => setCompressionQuality(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{t.imageCompressor.lowQuality}</span>
                    <span>{t.imageCompressor.mediumQuality}</span>
                    <span>{t.imageCompressor.highQuality}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={compressAllImages}
                className="btn-primary flex items-center justify-center gap-2"
                disabled={pendingCount === 0 || isBatchCompressing}
              >
                {isBatchCompressing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.imageCompressor.compressing}
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    {t.imageCompressor.compressAll} ({pendingCount}{t.imageCompressor.pending})
                  </>
                )}
              </button>

              {doneCount > 0 && (
                <button
                  onClick={downloadAllImages}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  {doneCount === 1 ? t.imageCompressor.downloading : t.imageCompressor.downloadAll}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tool Content - 图片裁剪工具 */}
      {tool.id === 'image-cropper' && <ImageCropperTool />}

      {/* Tool Content - 书签转换工具 */}
      {tool.id === 'bookmark-converter' && <BookmarkConverter />}

      {/* Tool Tips */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8 border border-gray-200 animate-fade-in">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          {t.toolDetail.tipsTitle}
        </h4>
        {tool.id === 'image-compressor' && (
          <ul className="space-y-2 text-gray-700">
            {t.imageCompressor.tips.map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {tool.id === 'image-cropper' && (
          <ul className="space-y-2 text-gray-700">
            {t.imageCropper.tips.map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
        {tool.id === 'bookmark-converter' && (
          <ul className="space-y-2 text-gray-700">
            {t.bookmarkConverter.tips.map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ImageCropperTool() {
  const { t } = useI18n()
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [cropError, setCropError] = useState('')
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [action, setAction] = useState<'draw' | 'move' | 'resize'>('draw')
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg')
  const [outputQuality, setOutputQuality] = useState(90)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ratios = [
    { key: 'free', label: t.imageCropper.free, value: null as number | null },
    { key: '1:1', label: '1:1', value: 1 },
    { key: '4:3', label: '4:3', value: 4 / 3 },
    { key: '3:4', label: '3:4', value: 3 / 4 },
    { key: '16:9', label: '16:9', value: 16 / 9 },
    { key: '9:16', label: '9:16', value: 9 / 16 },
    { key: '3:2', label: '3:2', value: 3 / 2 },
    { key: '2:3', label: '2:3', value: 2 / 3 },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCropError(t.imageCropper.errorFileType)
      return
    }
    setCropError('')
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    if (sourceImage) URL.revokeObjectURL(sourceImage)
    setSourceImage(url)
    setCropArea({ x: 0, y: 0, width: 0, height: 0 })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCropError(t.imageCropper.errorFileType)
      return
    }
    setCropError('')
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    if (sourceImage) URL.revokeObjectURL(sourceImage)
    setSourceImage(url)
    setCropArea({ x: 0, y: 0, width: 0, height: 0 })
  }

  const handleImageLoad = () => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return

    const containerWidth = container.clientWidth
    const maxHeight = Math.max(720, (window.innerHeight - 220) * 2)
    const scaleByWidth = containerWidth / img.naturalWidth
    const scaleByHeight = maxHeight / img.naturalHeight
    const scale = Math.min(scaleByWidth, scaleByHeight, 1)
    const displayWidth = img.naturalWidth * scale
    const displayHeight = img.naturalHeight * scale

    setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    setDisplaySize({ width: displayWidth, height: displayHeight })

    const fitContainerWidth = Math.min(displayWidth, containerWidth)
    const initialWidth = fitContainerWidth * 0.6
    const initialHeight = aspectRatio ? initialWidth / aspectRatio : displayHeight * 0.6
    setCropArea({
      x: (displayWidth - initialWidth) / 2,
      y: (displayHeight - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight,
    })
  }
  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const getCursorAt = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const handleSize = 12
    const handles = [
      { name: 'nw', x: cropArea.x - handleSize, y: cropArea.y - handleSize },
      { name: 'ne', x: cropArea.x + cropArea.width, y: cropArea.y - handleSize },
      { name: 'sw', x: cropArea.x - handleSize, y: cropArea.y + cropArea.height },
      { name: 'se', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
    ]
    for (const h of handles) {
      if (pos.x >= h.x && pos.x <= h.x + handleSize * 2 && pos.y >= h.y && pos.y <= h.y + handleSize * 2) {
        return h.name
      }
    }
    if (pos.x >= cropArea.x && pos.x <= cropArea.x + cropArea.width && pos.y >= cropArea.y && pos.y <= cropArea.y + cropArea.height) {
      return 'inside'
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sourceImage) return
    e.preventDefault()
    const pos = getMousePos(e)
    const cursorAt = getCursorAt(e)

    if (cursorAt === 'inside') {
      setAction('move')
      setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y })
    } else if (cursorAt && ['nw', 'ne', 'sw', 'se'].includes(cursorAt)) {
      setAction('resize')
      setResizeHandle(cursorAt)
      setDragStart(pos)
    } else {
      setAction('draw')
      setDragStart(pos)
      setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    const pos = getMousePos(e)
    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    if (action === 'draw') {
      let x = Math.min(dragStart.x, pos.x)
      let y = Math.min(dragStart.y, pos.y)
      let width = Math.abs(pos.x - dragStart.x)
      let height = Math.abs(pos.y - dragStart.y)

      x = Math.max(0, Math.min(x, rect.width))
      y = Math.max(0, Math.min(y, rect.height))
      width = Math.min(width, rect.width - x)
      height = Math.min(height, rect.height - y)

      if (aspectRatio) {
        if (width / height > aspectRatio) {
          width = height * aspectRatio
        } else {
          height = width / aspectRatio
        }
      }

      setCropArea({ x, y, width, height })
    } else if (action === 'move') {
      let x = pos.x - dragStart.x
      let y = pos.y - dragStart.y
      x = Math.max(0, Math.min(x, rect.width - cropArea.width))
      y = Math.max(0, Math.min(y, rect.height - cropArea.height))
      setCropArea(prev => ({ ...prev, x, y }))
    } else if (action === 'resize' && resizeHandle) {
      let { x, y, width, height } = cropArea

      if (resizeHandle.includes('e')) {
        width = Math.max(20, Math.min(pos.x - x, rect.width - x))
      }
      if (resizeHandle.includes('w')) {
        const newX = Math.max(0, Math.min(pos.x, x + width - 20))
        width = x + width - newX
        x = newX
      }
      if (resizeHandle.includes('s')) {
        height = Math.max(20, Math.min(pos.y - y, rect.height - y))
      }
      if (resizeHandle.includes('n')) {
        const newY = Math.max(0, Math.min(pos.y, y + height - 20))
        height = y + height - newY
        y = newY
      }

      if (aspectRatio) {
        if (width / height > aspectRatio) {
          width = height * aspectRatio
        } else {
          height = width / aspectRatio
        }
        if (resizeHandle.includes('w')) x = cropArea.x + cropArea.width - width
        if (resizeHandle.includes('n')) y = cropArea.y + cropArea.height - height
      }

      setCropArea({ x, y, width, height })
    }
  }, [action, dragStart, aspectRatio, cropArea, resizeHandle])

  const handleMouseUp = useCallback(() => {
    setAction('draw')
    setResizeHandle(null)
  }, [])

  useEffect(() => {
    if (action !== 'draw') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [action, handleMouseMove, handleMouseUp])

  const handleCrop = () => {
    if (!sourceImage || !imgRef.current || cropArea.width < 10 || cropArea.height < 10) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
    if (!container) return
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calculate image offset within the container (due to flex centering)
    const offsetX = Math.max(0, (containerWidth - displaySize.width) / 2)
    const offsetY = Math.max(0, (containerHeight - displaySize.height) / 2)

    const scaleX = imageSize.width / displaySize.width
    const scaleY = imageSize.height / displaySize.height

    const sourceX = (cropArea.x - offsetX) * scaleX
    const sourceY = (cropArea.y - offsetY) * scaleY
    const sourceWidth = cropArea.width * scaleX
    const sourceHeight = cropArea.height * scaleY

    // Clamp to image boundaries
    const clampedSourceX = Math.max(0, sourceX)
    const clampedSourceY = Math.max(0, sourceY)
    const clampedWidth = Math.min(sourceWidth, imageSize.width - clampedSourceX)
    const clampedHeight = Math.min(sourceHeight, imageSize.height - clampedSourceY)

    if (clampedWidth < 1 || clampedHeight < 1) return

    canvas.width = clampedWidth
    canvas.height = clampedHeight

    ctx.drawImage(
      imgRef.current,
      clampedSourceX,
      clampedSourceY,
      clampedWidth,
      clampedHeight,
      0,
      0,
      clampedWidth,
      clampedHeight
    )

    const mimeType = outputFormat
    const extension = mimeType === 'image/png' ? 'png' : 'jpg'

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = fileName.replace(/\.[^/.]+$/, '') || 'cropped'
      link.download = `cropped_${ext}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, mimeType, outputQuality / 100)
  }

  const clearImage = () => {
    if (sourceImage) URL.revokeObjectURL(sourceImage)
    setSourceImage(null)
    setFileName('')
    setCropArea({ x: 0, y: 0, width: 0, height: 0 })
    setCropError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 animate-fade-in">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center text-gray-900">
          <Crop className="h-6 w-6 text-gray-600 mr-2" />
          {t.imageCropper.title}
        </h3>

        {/* Upload */}
        {!sourceImage && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-gray-400 transition-colors duration-200"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 mx-auto mb-4">
              <Upload className="h-8 w-8" />
            </div>
            <p className="text-gray-600 mb-4">{t.imageCropper.dropzone}</p>
            <input
              type="file"
              className="hidden"
              id="crop-upload"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <label htmlFor="crop-upload" className="btn-primary cursor-pointer inline-block">
              {t.imageCropper.uploadBtn}
            </label>
          </div>
        )}
        {cropError && <p className="text-red-500 text-sm mt-2">{cropError}</p>}
      </div>

      {/* Cropper */}
      {sourceImage && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">{t.imageCropper.ratioLabel}:</span>
            {ratios.map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  setAspectRatio(r.value)
                  if (cropArea.width > 0 && cropArea.height > 0 && r.value && displaySize.width > 0) {
                    const newHeight = cropArea.width / r.value
                    const newY = Math.min(cropArea.y, displaySize.height - newHeight)
                    setCropArea({ ...cropArea, y: Math.max(0, newY), height: newHeight })
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  aspectRatio === r.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={clearImage}
              className="ml-auto flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors duration-200 text-sm"
            >
              <X className="h-4 w-4" />
              {t.imageCropper.reselect}
            </button>
          </div>

          {/* Image with crop overlay */}
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg cursor-crosshair select-none flex justify-center"
            onMouseDown={handleMouseDown}
            style={{ minHeight: 200, height: displaySize.height || 'auto' }}
          >
            <img
              ref={imgRef}
              src={sourceImage}
              alt={t.imageCropper.imgAlt}
              className="block"
              onLoad={handleImageLoad}
              draggable={false}
              style={{ width: displaySize.width || '100%', height: displaySize.height || 'auto' }}
            />
            {/* Crop overlay */}
            {cropArea.width > 0 && cropArea.height > 0 && (
              <div
                className="absolute border-2 border-white"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  cursor: 'move',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  const pos = getMousePos(e)
                  setAction('move')
                  setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y })
                }}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  <div className="flex-1 border-r border-white/50" />
                  <div className="flex-1 border-r border-white/50" />
                  <div className="flex-1" />
                </div>
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  <div className="flex-1 border-b border-white/50" />
                  <div className="flex-1 border-b border-white/50" />
                  <div className="flex-1" />
                </div>
                {/* Resize handles */}
                {(['nw', 'ne', 'sw', 'se'] as const).map((h) => {
                  const style: React.CSSProperties = {
                    position: 'absolute',
                    width: 12,
                    height: 12,
                    backgroundColor: 'white',
                    border: '1px solid #374151',
                    borderRadius: 2,
                    zIndex: 10,
                  }
                  if (h.includes('n')) style.top = -6
                  if (h.includes('s')) style.bottom = -6
                  if (h.includes('w')) style.left = -6
                  if (h.includes('e')) style.right = -6
                  const cursorMap: Record<string, string> = {
                    nw: 'nw-resize',
                    ne: 'ne-resize',
                    sw: 'sw-resize',
                    se: 'se-resize',
                  }
                  return (
                    <div
                      key={h}
                      style={{ ...style, cursor: cursorMap[h] }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setAction('resize')
                        setResizeHandle(h)
                        setDragStart(getMousePos(e))
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Info */}
          {cropArea.width > 0 && cropArea.height > 0 && (
            <p className="text-sm text-gray-600">
              {t.imageCropper.cropArea}: {Math.round(cropArea.width * (imageSize.width / displaySize.width))} x{' '}
              {Math.round(cropArea.height * (imageSize.height / displaySize.height))} px
            </p>
          )}

          {/* Output Settings */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-700 font-medium">{t.imageCropper.outputFormat}:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOutputFormat('image/jpeg')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    outputFormat === 'image/jpeg'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  JPG
                </button>
                <button
                  onClick={() => setOutputFormat('image/png')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    outputFormat === 'image/png'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.imageCropper.png}
                </button>
              </div>
            </div>

            {outputFormat === 'image/jpeg' && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-700">{t.imageCropper.outputQuality}</label>
                  <span className="text-sm text-gray-900 font-medium">{outputQuality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={outputQuality}
                  onChange={(e) => setOutputQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{t.imageCropper.lowQualitySmall}</span>
                  <span>{t.imageCropper.highQualityLarge}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCrop}
              className="btn-primary flex items-center justify-center gap-2"
              disabled={cropArea.width < 10 || cropArea.height < 10}
            >
              <Download className="h-4 w-4" />
              {t.imageCropper.cropBtn}
            </button>
            <p className="text-xs text-gray-500 self-center">
              {t.imageCropper.helper}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolDetail
