import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import {
  ChevronDown,
  Flower2,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { z } from 'zod'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Button } from '#/components/ui/button'
import { useLocale } from '#/lib/i18n'
import { listPublicCatalogFn, listCatalogVariationsFn } from '#/server/catalog'

const searchSchema = z.object({ variation: z.string().optional() })

export const Route = createFileRoute('/catalog/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ variation: search.variation }),
  loader: async ({ deps }) => {
    const [products, variations] = await Promise.all([
      listPublicCatalogFn({ data: { variation: deps.variation } }),
      listCatalogVariationsFn(),
    ])
    return { products, variations }
  },
  component: CatalogPage,
})

function CatalogPage() {
  const { t } = useLocale()
  const navigate = useNavigate({ from: '/catalog/' })
  const search = useSearch({ from: '/catalog/' })
  const { products, variations } = Route.useLoaderData()

  function updateVariation(value: string) {
    void navigate({
      search: value ? { variation: value } : {},
    })
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

      <main className="catalog-main">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">{t('publicKicker')}</p>
            <h1>{t('catalogTitle')}</h1>
            <p className="catalog-intro">{t('catalogIntro')}</p>
          </div>
          {variations.length > 0 ? (
            <label className="variation-filter">
              <span>
                <SlidersHorizontal aria-hidden="true" size={16} />
                {t('variationFilter')}
              </span>
              <span className="select-wrap">
                <select
                  aria-label={t('variationFilter')}
                  value={search.variation ?? ''}
                  onChange={(event) => updateVariation(event.target.value)}
                >
                  <option value="">{t('allVariations')}</option>
                  {variations.map((variation) => (
                    <option key={variation} value={variation}>
                      {variation}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" size={15} />
              </span>
            </label>
          ) : null}
        </div>

        {search.variation ? (
          <div className="active-filter">
            <span>{search.variation}</span>
            <Button
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => updateVariation('')}
            >
              {t('clearFilter')}
            </Button>
          </div>
        ) : null}

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
                        {product.variations.length > 0
                          ? product.variations
                              .map((item) => item.name)
                              .join(' · ')
                          : t('emptyDescription')}
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
