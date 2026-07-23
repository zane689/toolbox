import { useState } from 'react'
import { Filter, Image } from 'lucide-react'
import { useToolStore } from '../store/useToolStore'
import ToolCard from '../components/tools/ToolCard'
import { useI18n } from '../i18n/context'

const categoryIconMap: Record<string, React.ReactNode> = {
  '设计工具': <Image className="h-5 w-5" />
}

function Categories() {
  const { t } = useI18n()
  const getFilteredTools = useToolStore(state => state.getFilteredTools)
  const allTools = useToolStore(state => state.tools)
  const filteredTools = getFilteredTools()

  const categories = Array.from(
    new Set(allTools.map(tool => tool.category))
  ).map((category) => ({
    id: category,
    name: category,
    icon: categoryIconMap[category] || <Image className="h-5 w-5" />
  }))

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const displayTools = selectedCategory === 'all'
    ? filteredTools
    : filteredTools.filter(tool => tool.category === selectedCategory)

  const toolLabel = (id: string) => {
    const map: Record<string, { title: string; desc: string; cat: string }> = {
      'image-compressor': { title: t.tools.imageCompressor, desc: t.tools.imageCompressorDesc, cat: t.tools.designTool },
      'image-cropper': { title: t.tools.imageCropper, desc: t.tools.imageCropperDesc, cat: t.tools.designTool },
      'bookmark-converter': { title: t.tools.bookmarkConverter, desc: t.tools.bookmarkConverterDesc, cat: t.tools.efficiencyTool },
    }
    return map[id] || { title: id, desc: '', cat: '' }
  }

  const getToolCategoryKey = (category: string): string => {
    if (category === '设计工具') return t.tools.designTool
    if (category === '效率工具') return t.tools.efficiencyTool
    return category
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          {t.categories.title}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t.categories.subtitle}
        </p>
      </section>

      {/* Category Filters */}
      <div className="mb-12 animate-slide-up">
        <div className="flex items-center mb-6">
          <Filter className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">{t.categories.filter}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t.categories.all}
          </button>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${selectedCategory === category.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {category.icon}
              {getToolCategoryKey(category.name)}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {displayTools.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Image className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{t.categories.emptyTitle}</h3>
          <p className="text-gray-600">{t.categories.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTools.map((tool, index) => {
            const labels = toolLabel(tool.id)
            return (
              <div key={tool.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ToolCard
                  id={tool.id}
                  title={labels.title}
                  description={labels.desc}
                  category={getToolCategoryKey(tool.category)}
                  iconName={tool.iconName}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Categories
