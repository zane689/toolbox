import ToolCard from '../components/tools/ToolCard'
import { useToolStore } from '../store/useToolStore'

function Favorites() {
  const { getFavoriteTools } = useToolStore()
  const favoriteTools = getFavoriteTools()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">我的收藏</h1>

      {favoriteTools.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-xl">还没有收藏任何工具</p>
          <p className="text-gray-400 mt-2">浏览工具并点击收藏按钮来添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteTools.map(tool => (
            <ToolCard
                key={tool.id}
                id={tool.id}
                title={tool.title}
                description={tool.description}
                category={tool.category === 'design' ? '设计工具' : tool.category === 'games' ? '娱乐游戏' : tool.category}
              />
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites