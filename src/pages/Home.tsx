import { useToolStore } from '../store/useToolStore'
import ToolCard from '../components/tools/ToolCard'
import { Lightbulb, Zap, Layout } from 'lucide-react'
import { useI18n } from '../i18n/context'

function Home() {
  const { t } = useI18n()
  const getFilteredTools = useToolStore(state => state.getFilteredTools)
  const tools = getFilteredTools()

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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20 pt-8 animate-fade-in">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
              {t.home.heading}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {t.home.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button className="btn-primary">
                {t.home.startBtn}
              </button>
              <button className="btn-secondary">
                {t.home.learnMore}
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
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{t.home.feature1Title}</h3>
              <p className="text-gray-600 text-sm">{t.home.feature1Desc}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center card-hover">
              <div className="inline-block p-2 bg-white rounded-lg mb-4 shadow-sm">
                <Zap className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{t.home.feature2Title}</h3>
              <p className="text-gray-600 text-sm">{t.home.feature2Desc}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center card-hover">
              <div className="inline-block p-2 bg-white rounded-lg mb-4 shadow-sm">
                <Layout className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{t.home.feature3Title}</h3>
              <p className="text-gray-600 text-sm">{t.home.feature3Desc}</p>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="mb-16 animate-slide-up">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">{t.home.toolsSectionTitle}</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm">
              {t.home.toolsSectionDesc}
            </p>
          </div>
          {tools.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">{t.home.noMatch}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tools.map((tool, index) => {
                const labels = toolLabel(tool.id)
                return (
                  <div key={tool.id} className="animate-fade-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
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
        </section>
      </div>
    </div>
  )
}

export default Home
