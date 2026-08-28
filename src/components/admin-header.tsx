import { Link, useRouter } from '@tanstack/react-router'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer'
import { forgetAdminCheck } from '#/lib/admin-guard'
import { useLocale } from '#/lib/i18n'
import { logoutFn } from '#/server/auth'

export function AdminHeader({ pendingCount }: { pendingCount: number }) {
  const { t } = useLocale()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await logoutFn()
    forgetAdminCheck()
    await router.navigate({ to: '/admin/login' })
  }

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <Link to="/admin" className="admin-brand">
          <img
            alt=""
            className="admin-brand-logo"
            height={44}
            src="/images/logo.jpg"
            width={44}
          />
          {t('adminBrand')}
        </Link>
        <nav className="admin-nav" aria-label={t('adminNavigation')}>
          <Link
            activeProps={{ className: 'is-active' }}
            className="admin-section-link"
            to="/admin/orders"
          >
            {t('orders')}{' '}
            <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
              {pendingCount}
            </Badge>
          </Link>
          <Link
            activeProps={{ className: 'is-active' }}
            className="admin-section-link"
            to="/admin/customers"
          >
            {t('customers')}
          </Link>
          <Link
            activeProps={{ className: 'is-active' }}
            className="admin-section-link"
            to="/admin/expenses"
          >
            {t('expenses')}
          </Link>
          <Link
            activeProps={{ className: 'is-active' }}
            className="admin-section-link"
            to="/admin/finance"
          >
            {t('finance')}
          </Link>
          <Link
            activeProps={{ className: 'is-active' }}
            className="admin-section-link"
            to="/admin/catalog"
          >
            {t('catalog')}
          </Link>
        </nav>
        <div className="admin-actions">
          <LanguageSwitcher />
          <Button
            className="logout-button"
            onClick={logout}
            type="button"
            variant="ghost"
          >
            <LogOut aria-hidden="true" size={16} />
            {t('logout')}
          </Button>
        </div>
        <Button
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          className="admin-menu-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {mobileOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </Button>
      </div>
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent className="admin-mobile-drawer">
          <DrawerHeader>
            <DrawerTitle>{t('adminBrand')}</DrawerTitle>
            <DrawerDescription>{t('adminNavigation')}</DrawerDescription>
          </DrawerHeader>
          <nav className="admin-mobile-nav" aria-label={t('adminNavigation')}>
            <Link
              activeProps={{ className: 'is-active' }}
              to="/admin/orders"
              onClick={() => setMobileOpen(false)}
            >
              {t('orders')}{' '}
              <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
                {pendingCount}
              </Badge>
            </Link>
            <Link
              activeProps={{ className: 'is-active' }}
              to="/admin/customers"
              onClick={() => setMobileOpen(false)}
            >
              {t('customers')}
            </Link>
            <Link
              activeProps={{ className: 'is-active' }}
              to="/admin/expenses"
              onClick={() => setMobileOpen(false)}
            >
              {t('expenses')}
            </Link>
            <Link
              activeProps={{ className: 'is-active' }}
              to="/admin/finance"
              onClick={() => setMobileOpen(false)}
            >
              {t('finance')}
            </Link>
            <Link
              activeProps={{ className: 'is-active' }}
              to="/admin/catalog"
              onClick={() => setMobileOpen(false)}
            >
              {t('catalog')}
            </Link>
          </nav>
          <DrawerFooter>
            <LanguageSwitcher />
            <DrawerClose asChild>
              <Button
                className="logout-button"
                onClick={logout}
                type="button"
                variant="outline"
              >
                <LogOut aria-hidden="true" size={16} />
                {t('logout')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </header>
  )
}
