import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type IconName = 'image' | 'crop' | 'bookmark'

interface Tool {
  id: string
  title: string
  description: string
  category: string
  iconName: IconName
}

interface ToolStore {
  tools: Tool[]
  favorites: string[]
  searchQuery: string
  addToFavorites: (id: string) => void
  removeFromFavorites: (id: string) => void
  setSearchQuery: (query: string) => void
  getFilteredTools: () => Tool[]
  getFavoriteTools: () => Tool[]
}

const mockTools: Tool[] = [
  {
    id: 'image-compressor',
    title: '图片压缩',
    description: '压缩图片大小，保持质量，支持多种格式',
    category: '设计工具',
    iconName: 'image'
  },
  {
    id: 'image-cropper',
    title: '图片裁剪',
    description: '支持多种比例裁剪图片，自由调整裁剪区域',
    category: '设计工具',
    iconName: 'crop'
  },
  {
    id: 'bookmark-converter',
    title: '书签转换',
    description: '将浏览器导出的 HTML 书签文件转换为 PDF 或 Word 格式',
    category: '效率工具',
    iconName: 'bookmark'
  }
]

export const useToolStore = create<ToolStore>()(
  persist(
    (set, get) => ({
      tools: mockTools,
      favorites: [],
      searchQuery: '',

      addToFavorites: (id) => set((state) => {
        if (state.favorites.includes(id)) return state
        return { favorites: [...state.favorites, id] }
      }),

      removeFromFavorites: (id) => set((state) => ({
        favorites: state.favorites.filter(favId => favId !== id)
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      getFilteredTools: () => {
        const { tools, searchQuery } = get()
        if (!searchQuery) return tools
        const query = searchQuery.toLowerCase()
        return tools.filter(tool =>
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.category.toLowerCase().includes(query)
        )
      },

      getFavoriteTools: () => {
        const { tools, favorites } = get()
        return tools.filter(tool => favorites.includes(tool.id))
      }
    }),
    {
      name: 'tool-storage'
    }
  )
)
