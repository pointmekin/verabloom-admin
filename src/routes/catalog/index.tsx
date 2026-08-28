import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Flower2, Image as ImageIcon } from 'lucide-react'

import { LanguageSwitcher } from '#/components/language-switcher'
import { useLocale } from '#/lib/i18n'
import { listPublicCatalogFn } from '#/server/catalog'

export const Route = createFileRoute('/catalog/')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  loader: async () => ({ products: await listPublicCatalogFn() }),
  component: CatalogPage,
})

function CatalogPage() {
  const { t } = useLocale()
  const { products } = Route.useLoaderData()

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

      <main className="catalog-main">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">{t('publicKicker')}</p>
            <h1>{t('catalogTitle')}</h1>
            <p className="catalog-intro">{t('catalogIntro')}</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="catalog-empty">
            <Flower2 aria-hidden="true" size={30} />
            <p>{t('noProducts')}</p>
          </div>
        ) : (
          <ul className="catalog-grid">
            {products.map((product) => {
              const cover = product.images.at(0)
              return (
                <li key={product.id}>
                  <Link
                    className="catalog-card"
                    to="/catalog/$productId"
                    params={{ productId: String(product.id) }}
                  >
                    <div className="catalog-card-image">
                      {cover ? (
                        <img
                          src={cover.url}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon aria-hidden="true" size={32} />
                      )}
                    </div>
                    <div className="catalog-card-body">
                      <h2>{product.name}</h2>
                      <p>
                        {product.startingPriceThb
                          ? `${t('startingPrice')}: ฿${product.startingPriceThb}`
                          : t('noStartingPrice')}
                      </p>
                      <span className="catalog-card-link">
                        {t('viewProduct')} →
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
