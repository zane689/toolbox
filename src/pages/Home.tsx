import { Image } from 'lucide-react'
import ToolCard from '../components/tools/ToolCard'

function Home() {
  // 模拟工具数据 - 只保留图片压缩工具
  const tools = [
    {
      id: 'image-compressor',
      title: '图片压缩',
      description: '压缩图片大小，保持质量，支持多种格式',
      category: '设计工具',
      icon: <Image className="h-6 w-6" />
    }
  ]



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-20 pt-10 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            <span className="text-gradient">设计师的工具箱</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
            为设计师提供各种实用工具，让你的工作更加高效和专业
          </p>

        </div>
      </section>

      {/* Tools Grid */}
      <section className="mb-20 animate-slide-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {tools.map((tool, index) => (
            <div key={tool.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <ToolCard
                id={tool.id}
                title={tool.title}
                description={tool.description}
                category={tool.category}
              />
            </div>
          ))}
        </div>
      </section>




    </div>
  )
}

export default Home