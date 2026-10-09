import { useTranslation } from 'react-i18next'

// Minimal buildable stub. FEAT-003 replaces this with the real public/admin routes.
export default function App() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-semibold text-brand-600">{t('app.title')}</h1>
    </div>
  )
}
