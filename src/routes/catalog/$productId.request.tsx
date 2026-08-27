import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Flower2 } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { LanguageSwitcher } from '#/components/language-switcher'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useLocale } from '#/lib/i18n'
import { getPublicProductFn } from '#/server/catalog'
import { orderRequestSchema } from '#/server/order'

const requestSearchSchema = z.object({
  variationId: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute('/catalog/$productId/request')({
  validateSearch: requestSearchSchema,
  loader: async ({ params }) => {
    const id = Number(params.productId)
    if (!Number.isSafeInteger(id) || id < 1) return null
    return getPublicProductFn({ data: { id } })
  },
  component: OrderRequestPage,
})

type FieldErrors = Record<string, string>

function OrderRequestPage() {
  const { t } = useLocale()
  const product = Route.useLoaderData()
  const search = Route.useSearch()
  const initialVariation =
    product?.variations.find((item) => item.id === search.variationId) ??
    product?.variations[0]
  const [variationId, setVariationId] = useState(
    initialVariation ? String(initialVariation.id) : '',
  )
  const [deliveryMethod, setDeliveryMethod] = useState('collection')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!product) {
    return (
      <main className="catalog-not-found">
        <p>{t('invalidProduct')}</p>
        <Link to="/catalog" className="text-link">
          {t('backToCatalog')}
        </Link>
      </main>
    )
  }
  const selectedProduct = product

  function fieldError(name: string) {
    return fieldErrors[name] ? (
      <p className="field-error" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null
  }

  function translateValidationIssue(field: string) {
    if (field === 'quantity') return t('invalidQuantity')
    if (field === 'requiredDate') return t('invalidDate')
    if (field === 'orderAddress') return t('deliveryAddressRequired')
    return t('requiredField')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setFieldErrors({})
    const form = new FormData(event.currentTarget)
    const parsed = orderRequestSchema.safeParse({
      productId: selectedProduct.id,
      variationId: form.get('variationId'),
      quantity: form.get('quantity'),
      customerName: form.get('customerName'),
      socialChannel: form.get('socialChannel'),
      socialContact: form.get('socialContact'),
      phone: form.get('phone'),
      requestDetails: form.get('requestDetails'),
      deliveryMethod: form.get('deliveryMethod'),
      orderAddress: form.get('orderAddress') ?? '',
      requiredDate: form.get('requiredDate'),
      honeypot: form.get('honeypot'),
    })
    if (!parsed.success) {
      const nextErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? 'form')
        nextErrors[field] ??= translateValidationIssue(field)
      }
      setFieldErrors(nextErrors)
      if (nextErrors.form) setError(nextErrors.form)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/order-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const remoteErrors = readFieldErrors(body)
        if (remoteErrors) {
          const nextErrors: FieldErrors = {}
          let formError: string | null = null
          for (const field of Object.keys(remoteErrors)) {
            if (field === 'productId') {
              formError = t('invalidProduct')
            } else {
              nextErrors[field] = translateValidationIssue(field)
            }
          }
          setFieldErrors(nextErrors)
          setError(formError)
        } else {
          setError(t('requestSubmitError'))
        }
        setSubmitting(false)
        return
      }
      const result = readSuccessfulRequest(body)
      if (!result) throw new Error('Missing request reference')
      window.location.assign(
        `/catalog/request-success?reference=${encodeURIComponent(result.requestReference)}`,
      )
    } catch {
      setError(t('requestSubmitError'))
      setSubmitting(false)
    }
  }

  function readFieldErrors(body: unknown) {
    if (!body || typeof body !== 'object' || !('error' in body)) return null
    const remoteError = body.error
    if (
      !remoteError ||
      typeof remoteError !== 'object' ||
      !('fieldErrors' in remoteError)
    ) {
      return null
    }
    const remoteErrors = remoteError.fieldErrors
    return remoteErrors && typeof remoteErrors === 'object'
      ? remoteErrors
      : null
  }

  function readSuccessfulRequest(body: unknown) {
    if (!body || typeof body !== 'object' || !('requestReference' in body)) {
      return null
    }
    const reference = body.requestReference
    return typeof reference === 'string'
      ? { requestReference: reference }
      : null
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

      <main className="request-main">
        <a href={`/catalog/${selectedProduct.id}`} className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('backToProduct')}
        </a>
        <div className="request-heading">
          <p className="eyebrow">{t('publicKicker')}</p>
          <h1>{t('requestTitle')}</h1>
          <p>{t('requestIntro')}</p>
        </div>

        <form className="request-form" noValidate onSubmit={submit}>
          {error ? (
            <Alert className="form-error" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="request-card request-product-card">
            <div>
              <p className="field-label">{t('selectedProduct')}</p>
              <h2>{selectedProduct.name}</h2>
            </div>
            <div className="form-field">
              <Label htmlFor="request-variation">
                {t('selectedVariation')}
              </Label>
              <select
                id="request-variation"
                name="variationId"
                aria-invalid={Boolean(fieldErrors.variationId)}
                value={variationId}
                onChange={(event) => setVariationId(event.target.value)}
                required
              >
                <option value="">{t('selectedVariation')}</option>
                {selectedProduct.variations.map((variation) => (
                  <option key={variation.id} value={variation.id}>
                    {variation.name}
                  </option>
                ))}
              </select>
              {fieldError('variationId')}
            </div>
          </Card>

          <Card className="request-card">
            <div className="request-fields-grid">
              <div className="form-field">
                <Label htmlFor="request-quantity">{t('quantity')}</Label>
                <Input
                  id="request-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  defaultValue="1"
                  aria-invalid={Boolean(fieldErrors.quantity)}
                  required
                />
                {fieldError('quantity')}
              </div>
              <div className="form-field">
                <Label htmlFor="request-name">{t('customerName')}</Label>
                <Input
                  id="request-name"
                  name="customerName"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.customerName)}
                  required
                />
                {fieldError('customerName')}
              </div>
            </div>

            <div className="form-field">
              <Label htmlFor="request-channel">{t('socialChannel')}</Label>
              <select
                id="request-channel"
                name="socialChannel"
                defaultValue="line"
              >
                <option value="line">{t('line')}</option>
                <option value="instagram">{t('instagram')}</option>
                <option value="tiktok">{t('tiktok')}</option>
              </select>
              {fieldError('socialChannel')}
            </div>

            <div className="form-field">
              <Label htmlFor="request-contact">{t('socialContact')}</Label>
              <Input
                id="request-contact"
                name="socialContact"
                aria-invalid={Boolean(fieldErrors.socialContact)}
                required
              />
              {fieldError('socialContact')}
            </div>

            <div className="form-field">
              <Label htmlFor="request-phone">{t('phone')}</Label>
              <Input
                id="request-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
              />
            </div>

            <div className="form-field">
              <Label htmlFor="request-details">{t('requestDetails')}</Label>
              <textarea
                id="request-details"
                name="requestDetails"
                rows={5}
                aria-describedby="request-details-hint"
              />
              <p id="request-details-hint" className="field-hint">
                {t('requestDetailsHint')}
              </p>
              {fieldError('requestDetails')}
            </div>
          </Card>

          <Card className="request-card">
            <div className="form-field">
              <Label htmlFor="request-delivery">{t('deliveryMethod')}</Label>
              <select
                id="request-delivery"
                name="deliveryMethod"
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value)}
              >
                <option value="postal">{t('postal')}</option>
                <option value="messenger">{t('messenger')}</option>
                <option value="collection">{t('collection')}</option>
              </select>
            </div>

            {deliveryMethod !== 'collection' ? (
              <div className="form-field">
                <Label htmlFor="request-address">{t('orderAddress')}</Label>
                <textarea
                  id="request-address"
                  name="orderAddress"
                  rows={4}
                  required
                  aria-invalid={Boolean(fieldErrors.orderAddress)}
                />
                {fieldError('orderAddress')}
              </div>
            ) : null}

            <div className="form-field">
              <Label htmlFor="request-date">{t('requiredDate')}</Label>
              <Input
                id="request-date"
                name="requiredDate"
                type="date"
                aria-invalid={Boolean(fieldErrors.requiredDate)}
                required
              />
              {fieldError('requiredDate')}
            </div>
          </Card>

          <div className="honeypot-field" aria-hidden="true">
            <Label htmlFor="request-honeypot">Website</Label>
            <Input
              id="request-honeypot"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="request-footer">
            <Button
              className="primary-button"
              disabled={submitting}
              type="submit"
            >
              {submitting ? t('submittingRequest') : t('submitRequest')}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
