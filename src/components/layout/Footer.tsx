function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">设计师工具网站</h3>
            <p className="text-gray-400 text-sm">
              为设计师提供各种实用工具的平台
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-3">联系我们</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>邮箱: contact@designertools.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">© 2024 设计师工具网站. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
