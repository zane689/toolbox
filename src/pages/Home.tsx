import { useToolStore } from '../store/useToolStore'
import ToolCard from '../components/tools/ToolCard'
import { Lightbulb, Zap, Layout } from 'lucide-react'

function Home() {
  const getFilteredTools = useToolStore(state => state.getFilteredTools)
  const tools = getFilteredTools()

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20 pt-8 animate-fade-in">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
              设计师的工具箱
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              为设计师提供各种实用工具，让你的工作更加高效和专业
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button className="btn-primary">
                开始使用
              </button>
              <button className="btn-secondary">
                了解更多
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-20 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 text-center card-hover">
              <div className="inline-block p-2 bg-white rounded-lg mb-4 shadow-sm">
                <Lightbulb className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">创意工具</h3>
              <p className="text-gray-600 text-sm">提供各种创意工具，帮助你激发灵感</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center card-hover">
              <div className="inline-block p-2 bg-white rounded-lg mb-4 shadow-sm">
                <Zap className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">高效工作</h3>
              <p className="text-gray-600 text-sm">简化设计流程，提高工作效率</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center card-hover">
              <div className="inline-block p-2 bg-white rounded-lg mb-4 shadow-sm">
                <Layout className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">专业品质</h3>
              <p className="text-gray-600 text-sm">提供专业级工具，确保设计质量</p>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="mb-16 animate-slide-up">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">精选工具</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm">
              我们精心挑选了各种实用工具，满足设计师的不同需求
            </p>
          </div>
          {tools.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">没有找到匹配的工具</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tools.map((tool, index) => (
                <div key={tool.id} className="animate-fade-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
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
        </section>
      </div>
    </div>
  )
}

export default Home
