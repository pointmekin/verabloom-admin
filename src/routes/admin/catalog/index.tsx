import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  Eye,
  EyeOff,
  Flower2,
  Image as ImageIcon,
  Plus,
  GripVertical,
} from 'lucide-react'
import { useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { useToast } from '#/components/ui/toast'
import { useLocale } from '#/lib/i18n'
import {
  listAdminCatalogFn,
  reorderCatalogProductsFn,
  setCatalogVisibilityFn,
} from '#/server/catalog'
import { getPendingOrderCountFn } from '#/server/admin-order'
import { getRequiredAdminFn } from '#/server/auth'

export const Route = createFileRoute('/admin/catalog/')({
  beforeLoad: () => getRequiredAdminFn(),
  loader: async () => {
    const [products, pendingCount] = await Promise.all([
      listAdminCatalogFn(),
      getPendingOrderCountFn(),
    ])
    return { products, pendingCount }
  },
  component: AdminCatalogPage,
})

function AdminCatalogPage() {
  const { t } = useLocale()
  const { toast } = useToast()
  const router = useRouter()
  const { products, pendingCount } = Route.useLoaderData()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function reorder(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= products.length) return
    setPending(true)
    setMessage(null)
    const orderedIds = products.map((product) => product.id)
    ;[orderedIds[index], orderedIds[nextIndex]] = [
      orderedIds[nextIndex],
      orderedIds[index],
    ]
    try {
      await reorderCatalogProductsFn({ data: { orderedIds } })
      await router.invalidate()
      setMessage(t('reorderSaved'))
      toast({ title: t('reorderSaved'), kind: 'success' })
    } catch {
      toast({ title: t('saveError'), kind: 'error' })
    } finally {
      setPending(false)
    }
  }

  async function toggleVisibility(id: number, visible: boolean) {
    setPending(true)
    setMessage(null)
    try {
      await setCatalogVisibilityFn({ data: { id, visible: !visible } })
      await router.invalidate()
      toast({ title: t('visibilitySaved'), kind: 'success' })
    } catch {
      toast({ title: t('saveError'), kind: 'error' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main catalog-admin-main">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{t('adminCatalog')}</h1>
          </div>
          <Button asChild className="primary-button compact-button">
            <Link to="/admin/catalog/$productId" params={{ productId: 'new' }}>
              <Plus aria-hidden="true" size={16} />
              {t('addProduct')}
            </Link>
          </Button>
        </div>
        {message ? (
          <Alert className="catalog-message">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        {products.length === 0 ? (
          <div className="admin-empty">
            <Flower2 aria-hidden="true" size={30} />
            <p>{t('noProducts')}</p>
            <Button asChild variant="outline">
              <Link
                to="/admin/catalog/$productId"
                params={{ productId: 'new' }}
              >
                {t('addProduct')}
              </Link>
            </Button>
          </div>
        ) : (
          <ol className="admin-product-list">
            {products.map((product, index) => {
              const cover = product.images.at(0)
              return (
                <li
                  key={product.id}
                  className={product.visible ? '' : 'is-hidden'}
                >
                  <div className="admin-product-drag" aria-hidden="true">
                    <GripVertical size={18} />
                    <span>{index + 1}</span>
                  </div>
                  <div className="admin-product-thumb">
                    {cover ? (
                      <img src={cover.url} alt="" />
                    ) : (
                      <ImageIcon aria-hidden="true" size={24} />
                    )}
                  </div>
                  <div className="admin-product-info">
                    <Link
                      to="/admin/catalog/$productId"
                      params={{ productId: String(product.id) }}
                    >
                      <h2>{product.name}</h2>
                    </Link>
                    <p>
                      {product.startingPriceThb
                        ? `${t('startingPrice')}: ฿${product.startingPriceThb}`
                        : t('noStartingPrice')}
                    </p>
                    <span
                      className={`visibility-badge ${product.visible ? 'is-visible' : ''}`}
                    >
                      {product.visible ? t('visible') : t('hidden')}
                    </span>
                  </div>
                  <div className="admin-product-actions">
                    <Button
                      aria-label={t('moveUp')}
                      disabled={pending || index === 0}
                      onClick={() => reorder(index, -1)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      ↑
                    </Button>
                    <Button
                      aria-label={t('moveDown')}
                      disabled={pending || index === products.length - 1}
                      onClick={() => reorder(index, 1)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      ↓
                    </Button>
                    <Button
                      aria-label={
                        product.visible ? t('hideProduct') : t('showProduct')
                      }
                      disabled={pending}
                      onClick={() =>
                        toggleVisibility(product.id, product.visible)
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      {product.visible ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/admin/catalog/$productId"
                        params={{ productId: String(product.id) }}
                      >
                        {t('editProduct')}
                      </Link>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </main>
    </div>
  )
}
