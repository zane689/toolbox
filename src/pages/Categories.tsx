import { useState } from 'react'
import { Image, Code, Filter } from 'lucide-react'
import ToolCard from '../components/tools/ToolCard'

function Categories() {
  // 模拟分类数据
  const categories = [
    { id: 'design', name: '设计工具', icon: <Image className="h-5 w-5" /> },
    { id: 'dev', name: '开发工具', icon: <Code className="h-5 w-5" /> }
  ]

  // 模拟工具数据 - 只保留图片压缩工具
  const tools = [
    {
      id: 'image-compressor',
      title: '图片压缩',
      description: '压缩图片大小，保持质量，支持多种格式',
      category: 'design',
      icon: <Image className="h-6 w-6" />
    }
  ]

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredTools = selectedCategory === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-gradient">工具分类</span>
        </h1>
        <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
          浏览我们的工具分类，找到适合你需求的工具
        </p>
      </section>

      {/* Category Filters */}
      <div className="mb-12 animate-slide-up">
        <div className="flex items-center mb-6">
          <Filter className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold">筛选工具</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 ${selectedCategory === 'all' ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-secondary-700 hover:bg-gray-200'}`}
          >
            全部
          </button>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 ${selectedCategory === category.id ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-secondary-700 hover:bg-gray-200'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredTools.map((tool, index) => (
          <div key={tool.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <ToolCard
                id={tool.id}
                title={tool.title}
                description={tool.description}
                category={categories.find(c => c.id === tool.category)?.name || tool.category}
              />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Image className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">暂无工具</h3>
          <p className="text-secondary-600">该分类下暂无工具，请选择其他分类</p>
        </div>
      )}
    </div>
  )
}

export default Categories