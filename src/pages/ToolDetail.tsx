import { useParams, Link } from 'react-router-dom'
import { Image, ArrowLeft, Upload, Download, Settings, Info } from 'lucide-react'
import { useState } from 'react'

function ToolDetail() {
  const { id } = useParams<{ id: string }>()
  const [compressionQuality, setCompressionQuality] = useState(80)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressed, setCompressed] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalSize, setOriginalSize] = useState<number>(0)
  const [compressedSize, setCompressedSize] = useState<number>(0)
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
      setOriginalSize(file.size)
      setCompressed(false)
      setCompressedImageUrl('')
    }
  }

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setFileName(file.name)
      setOriginalSize(file.size)
      setCompressed(false)
      setCompressedImageUrl('')
    }
  }

  // 压缩图片
  const compressImage = () => {
    if (!selectedFile) return

    setIsCompressing(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // 使用浏览器原生的Image对象
    const img = new (window as any).Image()

    img.onload = () => {
      // 设置 canvas 尺寸
      canvas.width = img.width
      canvas.height = img.height

      // 绘制图片
      ctx?.drawImage(img, 0, 0)

      // 确定输出格式：对于PNG，使用JPEG以获得更好的压缩效果
      const outputType = selectedFile.type === 'image/png' ? 'image/jpeg' : selectedFile.type

      // 压缩图片
      canvas.toBlob((blob) => {
        if (blob) {
          setCompressedSize(blob.size)
          const url = URL.createObjectURL(blob)
          setCompressedImageUrl(url)
          setCompressed(true)
          setIsCompressing(false)
        }
      }, outputType, compressionQuality / 100)
    }

    img.src = URL.createObjectURL(selectedFile)
  }

  // 下载压缩后的图片
  const downloadImage = () => {
    if (!compressedImageUrl) return

    // 确定文件扩展名
    const extension = selectedFile?.type === 'image/png' ? 'jpg' : selectedFile?.type.split('/')[1] || 'jpg'
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "")
    const downloadFileName = `compressed_${fileNameWithoutExt}.${extension}`

    const link = document.createElement('a')
    link.href = compressedImageUrl
    link.download = downloadFileName
    link.click()
  }

  // 计算压缩率
  const getCompressionRatio = () => {
    if (!originalSize || !compressedSize) return 0
    return Math.round((1 - compressedSize / originalSize) * 100)
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 模拟工具数据 - 只保留图片压缩工具
  const tools = {
    'image-compressor': {
      title: '图片压缩',
      description: '压缩图片大小，保持质量，支持多种格式',
      category: '设计工具',
      icon: <Image className="h-8 w-8" />,
      content: (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 animate-fade-in">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-6 flex items-center">
              <Settings className="h-6 w-6 text-primary-600 mr-2" />
              图片压缩工具
            </h3>
            
            {/* Drop Zone */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-300 transition-colors duration-300"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4">
                    <Image className="h-12 w-12" />
                  </div>
                  <p className="text-secondary-600 mb-2">{fileName}</p>
                  <p className="text-secondary-500 mb-4">{formatFileSize(originalSize)}</p>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 bg-gray-100 text-secondary-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                  >
                    更换图片
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-secondary-600 mb-4">点击或拖拽图片到此处上传</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="image-upload" 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <label 
                    htmlFor="image-upload" 
                    className="btn-primary cursor-pointer inline-block"
                  >
                    选择图片
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Compression Settings */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <Settings className="h-5 w-5 text-primary-600 mr-2" />
              压缩设置
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-secondary-700">压缩质量</label>
                  <span className="text-primary-600 font-medium">{compressionQuality}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={compressionQuality}
                  onChange={(e) => setCompressionQuality(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-secondary-500 mt-1">
                  <span>低质量</span>
                  <span>中等质量</span>
                  <span>高质量</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button 
              onClick={compressImage}
              className="w-full btn-primary flex items-center justify-center gap-2"
              disabled={!selectedFile || isCompressing}
            >
              {isCompressing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  压缩中...
                </>
              ) : (
                '压缩图片'
              )}
            </button>

            {/* Compressed Result */}
            {compressed && compressedImageUrl && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-green-700">压缩完成</h5>
                  <span className="text-sm text-green-600">减少了 {getCompressionRatio()}% 的大小</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h6 className="text-sm font-medium mb-2">原始图片</h6>
                    {selectedFile && (
                      <div className="border border-gray-200 rounded-lg p-2">
                        <img 
                          src={URL.createObjectURL(selectedFile)} 
                          alt="原始图片"
                          className="w-full h-auto rounded"
                        />
                        <p className="text-sm text-secondary-600 mt-2">{formatFileSize(originalSize)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h6 className="text-sm font-medium mb-2">压缩后图片</h6>
                    <div className="border border-gray-200 rounded-lg p-2">
                      <img 
                        src={compressedImageUrl} 
                        alt="压缩后图片"
                        className="w-full h-auto rounded"
                      />
                      <p className="text-sm text-secondary-600 mt-2">{formatFileSize(compressedSize)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={downloadImage}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors duration-300 px-4 py-2 bg-white border border-primary-200 rounded-lg hover:bg-primary-50"
                  >
                    <Download className="h-4 w-4" />
                    下载图片
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  const tool = tools[id as keyof typeof tools]

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">工具不存在</h1>
          <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors duration-300">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center mb-8 text-sm">
        <Link to="/" className="flex items-center text-secondary-600 hover:text-primary-600 transition-colors duration-300 mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          首页
        </Link>
        <span className="text-gray-400">/</span>
        <Link to="/categories" className="flex items-center text-secondary-600 hover:text-primary-600 transition-colors duration-300 mx-4">
          分类
        </Link>
        <span className="text-gray-400">/</span>
        <span className="mx-4 text-secondary-800 font-medium">{tool.title}</span>
      </div>

      {/* Tool Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 flex-shrink-0">
            {tool.icon}
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold mb-2">{tool.title}</h1>
            <div className="inline-block px-4 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-4">
              {tool.category}
            </div>
            <p className="text-secondary-600 text-lg">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      {tool.content}

      {/* Tool Tips */}
      <div className="bg-blue-50 rounded-xl p-6 mt-8 border border-blue-100 animate-fade-in">
        <h4 className="text-lg font-medium text-blue-700 mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          使用提示
        </h4>
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            <span>选择高质量设置时，图片质量损失较小，但压缩率也较低</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            <span>支持 JPG、PNG、WebP 等常见图片格式</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            <span>压缩后的图片会保持原始图片的宽高比</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ToolDetail