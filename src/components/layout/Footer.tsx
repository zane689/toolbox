import { useI18n } from '../../i18n/context'

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">{t.footer.brand}</h3>
            <p className="text-gray-400 text-sm">
              {t.footer.desc}
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-3">{t.footer.contact}</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>{t.footer.email} tongboh@163.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
