import { Link } from 'react-router-dom'
import { Heart, ArrowRight } from 'lucide-react'
import { useToolStore } from '../../store/useToolStore'

interface ToolCardProps {
  id: string
  title: string
  description: string
  category: string
}

function ToolCard({ id, title, description, category }: ToolCardProps) {
  const { favorites, addToFavorites, removeFromFavorites } = useToolStore()
  const isFavorite = favorites.includes(id)

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isFavorite) {
      removeFromFavorites(id)
    } else {
      addToFavorites(id)
    }
  }

  // 为每个工具生成一个大的背景图片
  const getToolImageUrl = (toolId: string) => {
    const prompts = {
      'image-compressor': 'professional image compression tool interface, clean design, blue and white color scheme, modern UI',
    }
    
    const prompt = prompts[toolId as keyof typeof prompts] || 'modern design tool interface, clean UI, blue color scheme'
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`
  }

  return (
    <Link to={`/tool/${id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 card-hover">
        {/* Large Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={getToolImageUrl(id)} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        
        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold group-hover:text-primary-600 transition-colors duration-300">
              {title}
            </h3>
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={isFavorite ? "取消收藏" : "收藏"}
            >
              <Heart 
                className={`h-5 w-5 transition-all duration-300 ${isFavorite ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-600 hover:text-red-500'}`} 
              />
            </button>
          </div>
          <p className="text-secondary-600 mb-6 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <div className="inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium">
              {category}
            </div>
            <div className="flex items-center text-primary-600 group-hover:translate-x-1 transition-transform duration-300">
              <span className="mr-2 text-sm font-medium">查看详情</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ToolCard