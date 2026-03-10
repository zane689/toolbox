import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ToolStore {
  tools: {
    id: string
    title: string
    description: string
    category: string
  }[]
  favorites: string[]
  searchQuery: string
  addToFavorites: (id: string) => void
  removeFromFavorites: (id: string) => void
  setSearchQuery: (query: string) => void
  getFilteredTools: () => {
    id: string
    title: string
    description: string
    category: string
  }[]
  getFavoriteTools: () => {
    id: string
    title: string
    description: string
    category: string
  }[]
}

// 模拟工具数据
const mockTools = [
  {
    id: 'color-picker',
    title: '颜色选择器',
    description: '选择和生成各种颜色方案，支持 HEX、RGB、HSL 等格式',
    category: 'design'
  },
  {
    id: 'font-preview',
    title: '字体预览',
    description: '预览各种字体效果，调整大小和样式',
    category: 'design'
  },
  {
    id: 'image-compressor',
    title: '图片压缩',
    description: '压缩图片大小，保持质量，支持多种格式',
    category: 'design'
  },
  {
    id: 'snake-game',
    title: '贪吃蛇游戏',
    description: '经典的贪吃蛇游戏，测试你的反应能力',
    category: 'games'
  }
]

export const useToolStore = create<ToolStore>()(
  persist(
    (set, get) => ({
      tools: mockTools,
      favorites: [],
      searchQuery: '',

      addToFavorites: (id) => set((state) => ({
        favorites: [...state.favorites, id]
      })),

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