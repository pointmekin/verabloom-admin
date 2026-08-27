import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Flower2, Image as ImageIcon } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Button } from '#/components/ui/button'
import { useLocale } from '#/lib/i18n'
import { getPublicProductFn } from '#/server/catalog'
import { renderMarkdownToHtml } from '#/lib/markdown'

function formatStartingPrice(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return `${whole}.${fraction.padEnd(2, '0').slice(0, 2)}`
}

export const Route = createFileRoute('/catalog/$productId')({
  loader: async ({ params }) => {
    const id = Number(params.productId)
    if (!Number.isSafeInteger(id) || id < 1) return null
    return getPublicProductFn({ data: { id } })
  },
  component: ProductPage,
})

function ProductPage() {
  const { t } = useLocale()
  const product = Route.useLoaderData()

  if (!product) {
    return (
      <main className="catalog-not-found">
        <p>{t('noProducts')}</p>
        <Link to="/catalog" className="text-link">
          {t('backToCatalog')}
        </Link>
      </main>
    )
  }

  return (
    <div className="public-shell catalog-shell">
      <header className="public-header">
        <Link className="brand" to="/">
          <Flower2 aria-hidden="true" size={22} />
          <span>Verabloom</span>
        </Link>
        <nav className="public-nav" aria-label="Primary">
          <Link to="/catalog" className="catalog-nav-link">
            {t('catalog')}
          </Link>
          <LanguageSwitcher />
          <Link className="admin-link" to="/admin/login">
            {t('adminSignIn')}
          </Link>
        </nav>
      </header>

      <main className="product-main">
        <Link to="/catalog" className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('backToCatalog')}
        </Link>
        <div className="product-layout">
          <section className="product-gallery" aria-label={t('productImages')}>
            {product.images.length > 0 ? (
              product.images.map((image) => (
                <img key={image.id} src={image.url} alt={product.name} />
              ))
            ) : (
              <div className="product-image-empty">
                <ImageIcon aria-hidden="true" size={42} />
              </div>
            )}
          </section>
          <article className="product-copy">
            <p className="eyebrow">{t('productDetails')}</p>
            <h1>{product.name}</h1>
            <div
              className="markdown-content"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownToHtml(product.description),
              }}
            />
            <Button asChild className="primary-button request-cta">
              <a href={`/catalog/${product.id}/request`}>
                {t('requestProduct')}
              </a>
            </Button>
            <section className="product-variations">
              <strong>
                {product.startingPriceThb
                  ? `${t('startingPrice')}: ฿${formatStartingPrice(product.startingPriceThb)}`
                  : t('noStartingPrice')}
              </strong>
              <p className="price-note">{t('indicativePriceNote')}</p>
            </section>
          </article>
        </div>
      </main>
    </div>
  )
}
