import { useTranslation } from 'react-i18next'

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="w-full border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-3 px-4 text-center text-xs text-gray-400 dark:text-gray-600">
      <span>{t('footer.madeBy')}</span>
      <span className="mx-2">·</span>
      <span className="font-mono">
        {t('footer.version')} {APP_VERSION}
      </span>
    </footer>
  )
}

export default Footer
