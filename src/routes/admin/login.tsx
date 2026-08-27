import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Flower2 } from 'lucide-react'
import { useState } from 'react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useLocale } from '#/lib/i18n'
import { loginFn } from '#/server/auth'

export const Route = createFileRoute('/admin/login')({ component: LoginPage })

function LoginPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)

    try {
      const result = await loginFn({
        data: {
          email: String(form.get('email')),
          password: String(form.get('password')),
        },
      })
      if (!result.ok) {
        setError(t('invalidCredentials'))
        return
      }
      await router.invalidate()
      await router.navigate({ to: '/admin' })
    } catch {
      setError(t('invalidCredentials'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-topbar">
        <Link to="/" className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('backToShop')}
        </Link>
        <LanguageSwitcher />
      </div>
      <Card className="login-card gap-0">
        <div className="login-brand">
          <Flower2 aria-hidden="true" /> Verabloom
        </div>
        <p className="eyebrow">{t('loginKicker')}</p>
        <h1>{t('loginTitle')}</h1>
        <p className="login-copy">{t('loginBody')}</p>
        <form onSubmit={submit} className="login-form">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {error ? (
            <Alert className="form-error" variant="destructive">
              <AlertDescription className="form-error-description">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}
          <Button className="primary-button" disabled={pending} type="submit">
            {pending ? t('signingIn') : t('signIn')}
          </Button>
        </form>
      </Card>
    </main>
  )
}
