import { Link } from 'react-router-dom'
import { Heart, ArrowRight, Image, Crop, Bookmark } from 'lucide-react'
import { useToolStore, IconName } from '../../store/useToolStore'

const iconMap: Record<IconName, React.ReactNode> = {
  image: <Image className="h-6 w-6" />,
  crop: <Crop className="h-6 w-6" />,
  bookmark: <Bookmark className="h-6 w-6" />
}

interface ToolCardProps {
  id: string
  title: string
  description: string
  category: string
  iconName: IconName
}

function ToolCard({ id, title, description, category, iconName }: ToolCardProps) {
  const favorites = useToolStore(state => state.favorites)
  const addToFavorites = useToolStore(state => state.addToFavorites)
  const removeFromFavorites = useToolStore(state => state.removeFromFavorites)
  const isFavorite = favorites.includes(id)

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isFavorite) {
      removeFromFavorites(id)
    } else {
      addToFavorites(id)
    }
  }

  return (
    <Link to={`/tool/${id}`} className="block group h-full">
      <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col">
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-gray-600">
                {iconMap[iconName]}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                {title}
              </h3>
            </div>
            <button
              onClick={handleFavorite}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 flex-shrink-0"
              aria-label={isFavorite ? "取消收藏" : "收藏"}
            >
              <Heart
                className={`h-4 w-4 transition-all duration-200 ${isFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
              />
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
              {category}
            </div>
            <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
              <span className="mr-1.5 text-xs font-medium">查看</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ToolCard
