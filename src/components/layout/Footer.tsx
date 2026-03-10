function Footer() {
  return (
    <footer className="bg-secondary-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gradient">设计师工具网站</h3>
            <p className="text-secondary-400 mb-6">
              为设计师提供各种实用工具的平台
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">联系我们</h4>
            <ul className="space-y-3 text-secondary-400">
              <li>邮箱: contact@designertools.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-800 mt-12 pt-8 text-center">
          <p className="text-secondary-500">© 2024 设计师工具网站. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer