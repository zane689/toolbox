import { Link, NavLink } from 'react-router-dom'
import { Search, Menu, X, Heart, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useToolStore } from '../../store/useToolStore'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { searchQuery, setSearchQuery, favorites } = useToolStore()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-gray-900">
            设计师工具
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900 transition-colors duration-200'
              }
            >
              首页
            </NavLink>
            <NavLink 
              to="/categories" 
              className={({ isActive }) => 
                isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900 transition-colors duration-200'
              }
            >
              分类
            </NavLink>
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <span>更多</span>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <NavLink 
                  to="/favorites" 
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>我的收藏</span>
                    {favorites.length > 0 && (
                      <span className="ml-auto bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {favorites.length}
                      </span>
                    )}
                  </div>
                </NavLink>
              </div>
            </div>
            <div className={`relative transition-all duration-200 ${isSearchFocused ? 'w-64' : 'w-48'}`}>
              <input 
                type="text" 
                placeholder="搜索工具..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
          >
            {isMenuOpen ? <X className="h-6 w-6 text-gray-900" /> : <Menu className="h-6 w-6 text-gray-900" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900 transition-colors duration-200'
                }
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </NavLink>
              <NavLink 
                to="/categories" 
                className={({ isActive }) => 
                  isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900 transition-colors duration-200'
                }
                onClick={() => setIsMenuOpen(false)}
              >
                分类
              </NavLink>
              <NavLink 
                to="/favorites" 
                className={({ isActive }) => 
                  isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900 transition-colors duration-200'
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span>我的收藏</span>
                  {favorites.length > 0 && (
                    <span className="ml-auto bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </div>
              </NavLink>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜索工具..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
