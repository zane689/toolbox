import { Link, NavLink } from 'react-router-dom'
import { Search, Menu, X, Heart, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useToolStore } from '../../store/useToolStore'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { searchQuery, setSearchQuery, favorites } = useToolStore()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gradient">
            设计师工具
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? 'text-primary-600 font-medium' : 'text-secondary-600 hover:text-primary-600 transition-colors duration-300'
              }
            >
              首页
            </NavLink>
            <NavLink 
              to="/categories" 
              className={({ isActive }) => 
                isActive ? 'text-primary-600 font-medium' : 'text-secondary-600 hover:text-primary-600 transition-colors duration-300'
              }
            >
              分类
            </NavLink>
            <div className="relative group">
              <button className="flex items-center gap-1 text-secondary-600 hover:text-primary-600 transition-colors duration-300">
                <span>更多</span>
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <NavLink 
                  to="/favorites" 
                  className="block px-4 py-2 text-secondary-600 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>我的收藏</span>
                    {favorites.length > 0 && (
                      <span className="ml-auto bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {favorites.length}
                      </span>
                    )}
                  </div>
                </NavLink>
              </div>
            </div>
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'w-64' : 'w-48'}`}>
              <input 
                type="text" 
                placeholder="搜索工具..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
          >
            {isMenuOpen ? <X className="h-6 w-6 text-secondary-700" /> : <Menu className="h-6 w-6 text-secondary-700" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? 'text-primary-600 font-medium' : 'text-secondary-600 hover:text-primary-600 transition-colors duration-300'
                }
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </NavLink>
              <NavLink 
                to="/categories" 
                className={({ isActive }) => 
                  isActive ? 'text-primary-600 font-medium' : 'text-secondary-600 hover:text-primary-600 transition-colors duration-300'
                }
                onClick={() => setIsMenuOpen(false)}
              >
                分类
              </NavLink>
              <NavLink 
                to="/favorites" 
                className={({ isActive }) => 
                  isActive ? 'text-primary-600 font-medium' : 'text-secondary-600 hover:text-primary-600 transition-colors duration-300'
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span>我的收藏</span>
                  {favorites.length > 0 && (
                    <span className="ml-auto bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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