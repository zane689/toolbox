import ToolCard from '../components/tools/ToolCard'
import { useToolStore } from '../store/useToolStore'
import { useI18n } from '../i18n/context'

function Favorites() {
  const { t } = useI18n()
  const tools = useToolStore(state => state.tools)
  const favorites = useToolStore(state => state.favorites)
  const favoriteTools = tools.filter(tool => favorites.includes(tool.id))

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
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">{t.favorites.title}</h1>

      {favoriteTools.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-xl">{t.favorites.empty}</p>
          <p className="text-gray-400 mt-2">{t.favorites.emptySub}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteTools.map(tool => {
            const labels = toolLabel(tool.id)
            return (
              <ToolCard
                key={tool.id}
                id={tool.id}
                title={labels.title}
                description={labels.desc}
                category={getToolCategoryKey(tool.category)}
                iconName={tool.iconName}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Favorites
