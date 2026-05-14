import { useState } from 'react'
import { Filter, Image } from 'lucide-react'
import { useToolStore } from '../store/useToolStore'
import ToolCard from '../components/tools/ToolCard'

const categoryIconMap: Record<string, React.ReactNode> = {
  '设计工具': <Image className="h-5 w-5" />
}

function Categories() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          工具分类
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          浏览我们的工具分类，找到适合你需求的工具
        </p>
      </section>

      {/* Category Filters */}
      <div className="mb-12 animate-slide-up">
        <div className="flex items-center mb-6">
          <Filter className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">筛选工具</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            全部
          </button>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${selectedCategory === category.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {category.icon}
              {category.name}
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
          <h3 className="text-xl font-semibold mb-2 text-gray-900">暂无工具</h3>
          <p className="text-gray-600">该分类下暂无工具，请选择其他分类</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTools.map((tool, index) => (
            <div key={tool.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <ToolCard
                id={tool.id}
                title={tool.title}
                description={tool.description}
                category={tool.category}
                iconName={tool.iconName}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Categories
