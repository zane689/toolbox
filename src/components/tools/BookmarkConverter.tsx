import { useState, useRef, useMemo } from 'react'
import { Upload, Download, X, FileText, Folder, Link as LinkIcon, FileType, ChevronDown, ChevronRight } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from 'docx'
import { saveAs } from './utils/saveAs'

const FONT_FILE = '/fonts/NotoSansSC-Regular.ttf'

let fontBytesCache: ArrayBuffer | null = null
const loadFont = async (): Promise<ArrayBuffer> => {
  if (fontBytesCache) return fontBytesCache
  const res = await fetch(FONT_FILE)
  if (!res.ok) throw new Error('字体文件加载失败')
  fontBytesCache = await res.arrayBuffer()
  return fontBytesCache
}

const isTtcFont = (bytes: ArrayBuffer): boolean => {
  const view = new DataView(bytes, 0, 4)
  const tag = view.getUint32(0, false)
  return tag === 0x74746366 // 'ttcf'
}


interface BookmarkItem {
  type: 'folder' | 'link'
  title: string
  url?: string
  addDate?: string
  icon?: string
  children: BookmarkItem[]
}

const formatTimestamp = (ts?: string) => {
  if (!ts) return ''
  const num = parseInt(ts, 10)
  if (isNaN(num) || num <= 0) return ''
  const d = new Date(num < 1e12 ? num * 1000 : num)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('zh-CN', { hour12: false })
}

function BookmarkConverter() {
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalLinks = useMemo(() => {
    const walk = (items: BookmarkItem[]): number =>
      items.reduce((sum, it) => sum + (it.type === 'link' ? 1 : 0) + walk(it.children), 0)
    return walk(bookmarks)
  }, [bookmarks])

  const totalFolders = useMemo(() => {
    const walk = (items: BookmarkItem[]): number =>
      items.reduce((sum, it) => sum + (it.type === 'folder' ? 1 : 0) + walk(it.children), 0)
    return walk(bookmarks)
  }, [bookmarks])

  const parseBookmarks = (html: string): BookmarkItem[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const buildFromDL = (dl: Element | null): BookmarkItem[] => {
      if (!dl) return []
      const result: BookmarkItem[] = []
      const children = Array.from(dl.children).filter((el) => el.tagName === 'DT')

      for (const dt of children) {
        const h3 = dt.querySelector(':scope > H3, :scope > h3')
        if (h3) {
          const nestedDL = dt.querySelector(':scope > DL, :scope > dl')
          result.push({
            type: 'folder',
            title: h3.textContent?.trim() || '未命名文件夹',
            addDate: h3.getAttribute('ADD_DATE') || undefined,
            children: buildFromDL(nestedDL),
          })
          continue
        }
        const a = dt.querySelector(':scope > A, :scope > a')
        if (a) {
          result.push({
            type: 'link',
            title: a.textContent?.trim() || a.getAttribute('HREF') || a.getAttribute('href') || '未命名链接',
            url: a.getAttribute('HREF') || a.getAttribute('href') || '',
            addDate: a.getAttribute('ADD_DATE') || a.getAttribute('add_date') || undefined,
            icon: a.getAttribute('ICON') || a.getAttribute('icon') || undefined,
            children: [],
          })
        }
      }
      return result
    }

    const rootDL = doc.querySelector('dl')
    return buildFromDL(rootDL)
  }

  const handleFile = async (file: File) => {
    setError('')
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setError('请选择 HTML 格式的书签文件')
      return
    }
    try {
      const text = await file.text()
      const parsed = parseBookmarks(text)
      if (parsed.length === 0) {
        setError('未能从文件中解析出书签，请确认文件格式')
        return
      }
      setBookmarks(parsed)
      setFileName(file.name)
    } catch (e) {
      setError('文件读取失败: ' + (e as Error).message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    setBookmarks([])
    setFileName('')
    setError('')
    setCollapsed({})
  }

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  interface PdfRow {
    text: string
    size: number
    indent: number
    isBold: boolean
    isLink: boolean
    url?: string
  }

  const buildPdfRows = (items: BookmarkItem[], depth = 0): PdfRow[] => {
    const out: PdfRow[] = []
    for (const it of items) {
      if (it.type === 'folder') {
        out.push({ text: '▸ ' + it.title, size: 15, indent: depth * 12, isBold: true, isLink: false })
        out.push(...buildPdfRows(it.children, depth + 1))
      } else {
        out.push({ text: '• ' + it.title, size: 11, indent: depth * 12, isBold: false, isLink: true, url: it.url })
        if (it.url) out.push({ text: it.url, size: 9, indent: depth * 12 + 10, isBold: false, isLink: false })
      }
    }
    return out
  }

  const downloadAsPdf = async () => {
    if (bookmarks.length === 0) return
    setIsConverting(true)
    setError('')
    try {
      const pdfDoc = await PDFDocument.create()
      const fontBytes = await loadFont()
      const customFont = isTtcFont(fontBytes)
        ? await pdfDoc.embedFont(fontBytes, { subset: true })
        : await pdfDoc.embedFont(fontBytes)
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 40
      const lineGap = 2
      let page = pdfDoc.addPage([pageWidth, pageHeight])
      let y = pageHeight - margin

      const wrapText = (text: string, size: number, maxWidth: number): string[] => {
        const chars = Array.from(text)
        const lines: string[] = []
        let line = ''
        for (const char of chars) {
          const test = line + char
          const width = customFont.widthOfTextAtSize(test, size)
          if (width > maxWidth && line.length > 0) {
            lines.push(line)
            line = char
          } else {
            line = test
          }
        }
        if (line) lines.push(line)
        return lines
      }

      const drawText = (text: string, size: number, x: number, color = rgb(0, 0, 0), bold = false) => {
        page.drawText(text, { x, y, size, font: bold ? helveticaBold : customFont, color })
      }

      drawText('Bookmarks Export', 20, margin, rgb(0, 0, 0), true)
      y -= 26

      drawText(`来源: ${fileName}  |  共 ${totalLinks} 个链接 / ${totalFolders} 个文件夹`, 9, margin)
      y -= 18

      const rows = buildPdfRows(bookmarks)
      const maxTextWidth = pageWidth - margin * 2

      for (const row of rows) {
        const font = row.isBold ? helveticaBold : customFont
        const fontSize = row.size
        const x = margin + row.indent
        const availableWidth = maxTextWidth - row.indent
        const wrapped = wrapText(row.text, fontSize, availableWidth)

        for (const line of wrapped) {
          if (y - fontSize < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }
          const color = row.isLink ? rgb(0.12, 0.31, 0.78) : rgb(0, 0, 0)
          page.drawText(line, {
            x,
            y: y - fontSize,
            size: fontSize,
            font,
            color,
          })
          y -= fontSize + lineGap
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const baseName = fileName.replace(/\.(html?|htm)$/i, '') || 'bookmarks'
      saveAs(blob, `${baseName}.pdf`)
    } catch (e) {
      setError('PDF 生成失败: ' + (e as Error).message)
    } finally {
      setIsConverting(false)
    }
  }

  const buildDocxChildren = (items: BookmarkItem[]): Paragraph[] => {
    const paras: Paragraph[] = []
    for (const it of items) {
      if (it.type === 'folder') {
        paras.push(
          new Paragraph({
            children: [new TextRun({ text: it.title, bold: true })],
            heading: HeadingLevel.HEADING_2,
          })
        )
        paras.push(...buildDocxChildren(it.children))
      } else {
        const dateStr = formatTimestamp(it.addDate)
        paras.push(
          new Paragraph({
            children: [
              new TextRun({ text: it.title, bold: true }),
              new TextRun({ text: dateStr ? `  (${dateStr})` : '' }),
            ],
          })
        )
        if (it.url) {
          paras.push(
            new Paragraph({
              children: [new TextRun({ text: it.url, style: 'Hyperlink' })],
            })
          )
        }
      }
    }
    return paras
  }

  const downloadAsDocx = async () => {
    if (bookmarks.length === 0) return
    setIsConverting(true)
    setError('')
    try {
      const doc = new Document({
        creator: '设计师工具',
        title: 'Bookmarks Export',
        description: 'Converted from HTML bookmark file',
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Bookmarks Export', bold: true, size: 36 })],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `来源: ${fileName}  |  共 ${totalLinks} 个链接，${totalFolders} 个文件夹`,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ children: [new TextRun({ text: '' })] }),
              ...buildDocxChildren(bookmarks),
            ],
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      const baseName = fileName.replace(/\.(html?|htm)$/i, '') || 'bookmarks'
      saveAs(blob, `${baseName}.docx`)
    } catch (e) {
      setError('Word 生成失败: ' + (e as Error).message)
    } finally {
      setIsConverting(false)
    }
  }

  const renderTree = (items: BookmarkItem[], parentKey = ''): React.ReactNode => {
    return items.map((it, idx) => {
      const key = `${parentKey}-${idx}`
      if (it.type === 'folder') {
        const isOpen = !collapsed[key]
        return (
          <div key={key} className="ml-2">
            <button
              onClick={() => toggleCollapse(key)}
              className="flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
              <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate">{it.title}</span>
              <span className="ml-auto text-xs text-gray-400">({it.children.length})</span>
            </button>
            {isOpen && it.children.length > 0 && (
              <div className="ml-4 border-l border-gray-100 pl-1">{renderTree(it.children, key)}</div>
            )}
          </div>
        )
      }
      return (
        <a
          key={key}
          href={it.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 py-1.5 px-2 ml-2 rounded-md hover:bg-gray-50 transition-colors group"
        >
          <span className="w-3.5 flex-shrink-0" />
          <LinkIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate group-hover:text-blue-600">{it.title}</span>
          {it.url && (
            <span className="ml-auto text-xs text-gray-400 truncate max-w-[200px] hidden md:inline">{it.url}</span>
          )}
        </a>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 animate-fade-in">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center text-gray-900">
          <FileText className="h-6 w-6 text-gray-600 mr-2" />
          书签转换工具
        </h3>

        {!bookmarks.length && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-gray-400 transition-colors duration-200"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 mx-auto mb-4">
              <Upload className="h-8 w-8" />
            </div>
            <p className="text-gray-600 mb-4">点击或拖拽浏览器导出的书签 HTML 文件到此处</p>
            <input
              type="file"
              className="hidden"
              id="bookmark-upload"
              accept=".html,.htm,text/html"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <label htmlFor="bookmark-upload" className="btn-primary cursor-pointer inline-block">
              选择文件
            </label>
            <p className="text-xs text-gray-400 mt-4">支持 Chrome / Edge / Firefox / Opera / QQ浏览器 导出的 .html 书签文件</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {bookmarks.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium truncate max-w-[260px]">{fileName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 ml-2">
              <span>链接 <span className="text-gray-900 font-medium">{totalLinks}</span></span>
              <span>·</span>
              <span>文件夹 <span className="text-gray-900 font-medium">{totalFolders}</span></span>
            </div>
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors duration-200 text-sm"
            >
              <X className="h-4 w-4" />
              重新选择
            </button>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">书签预览</h4>
            <div className="border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto bg-white">
              {renderTree(bookmarks)}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">导出为</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadAsPdf}
                disabled={isConverting}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FileType className="h-4 w-4" />
                {isConverting ? '生成中...' : '下载为 PDF'}
              </button>
              <button
                onClick={downloadAsDocx}
                disabled={isConverting}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isConverting ? '生成中...' : '下载为 Word (.docx)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookmarkConverter
