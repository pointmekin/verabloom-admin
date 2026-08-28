import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'

import { AdminHeader } from '#/components/admin-header'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { useToast } from '#/components/ui/toast'
import { useLocale } from '#/lib/i18n'
import { renderMarkdownToHtml } from '#/lib/markdown'
import {
  getAdminProductFn,
  productInputSchema,
  saveCatalogProductFn,
  uploadProductImageFn,
} from '#/server/catalog'
import { getPendingOrderCountFn } from '#/server/admin-order'
import { requireAdmin } from '#/lib/admin-guard'

type EditableImage = {
  id?: number
  objectKey: string
  url: string
}

type PendingImage = {
  id: string
  file: File
}

export const Route = createFileRoute('/admin/catalog/$productId')({
  beforeLoad: () => requireAdmin(),
  loader: async ({ params }) => {
    const [product, pendingCount] = await Promise.all([
      params.productId === 'new'
        ? Promise.resolve(null)
        : (() => {
            const id = Number(params.productId)
            return Number.isSafeInteger(id) && id > 0
              ? getAdminProductFn({ data: { id } })
              : Promise.resolve(null)
          })(),
      getPendingOrderCountFn(),
    ])
    return { product, pendingCount }
  },
  component: AdminProductEditor,
})

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function AdminProductEditor() {
  const { t } = useLocale()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { product, pendingCount } = Route.useLoaderData()
  const isNew = product === null
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [visible, setVisible] = useState(product?.visible ?? true)
  const [startingPriceThb, setStartingPriceThb] = useState(
    product?.startingPriceThb ?? '',
  )
  const [images, setImages] = useState<EditableImage[]>(product?.images ?? [])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= images.length) return
    setImages((current) => {
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  function movePendingImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= pendingImages.length) return
    setPendingImages((current) => {
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const payload = {
      id: product?.id,
      name,
      description,
      startingPriceThb: startingPriceThb.trim() || null,
      visible,
      images,
    }
    const parsed = productInputSchema.safeParse(payload)
    if (!parsed.success) {
      setError(t('checkForm'))
      return
    }

    setSaving(true)
    try {
      let saved = await saveCatalogProductFn({ data: parsed.data })
      if (!saved) throw new Error('Product could not be saved')

      if (pendingImages.length > 0) {
        const uploaded = []
        for (const pendingImage of pendingImages) {
          const upload = await uploadProductImageFn({
            data: {
              productId: saved.id,
              mimeType: pendingImage.file.type,
              base64: await fileToBase64(pendingImage.file),
            },
          })
          uploaded.push({ objectKey: upload.objectKey, url: upload.publicUrl })
        }
        saved = await saveCatalogProductFn({
          data: {
            id: saved.id,
            name: saved.name,
            description: saved.description,
            startingPriceThb: saved.startingPriceThb,
            visible: saved.visible,
            images: [...saved.images, ...uploaded],
          },
        })
        if (!saved) throw new Error('Product could not be saved')
      }
      if (isNew) {
        setPendingImages([])
        setImages(saved.images)
        await navigate({
          to: '/admin/catalog/$productId',
          params: { productId: String(saved.id) },
        })
      } else {
        setPendingImages([])
        setImages(saved.images)
      }
      toast({ title: t('productSaved'), kind: 'success' })
    } catch {
      const message = t('saveError')
      setError(message)
      toast({ title: message, kind: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-shell">
      <AdminHeader pendingCount={pendingCount} />
      <main className="admin-main product-editor-main">
        <Link to="/admin/catalog" className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('adminCatalog')}
        </Link>
        <div className="admin-page-heading editor-heading">
          <div>
            <p className="eyebrow">{t('adminProtected')}</p>
            <h1>{isNew ? t('addProduct') : t('editProduct')}</h1>
          </div>
        </div>
        <form className="product-editor-form" noValidate onSubmit={submit}>
          {error ? (
            <Alert className="form-error" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Card className="editor-card">
            <div className="form-field">
              <Label htmlFor="product-name">{t('productName')}</Label>
              <Input
                id="product-name"
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="product-description">{t('description')}</Label>
              <Textarea
                id="product-description"
                name="description"
                rows={10}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <p className="field-hint">{t('markdownGuide')}</p>
            </div>
            <div className="form-field">
              <Label htmlFor="product-price">{t('priceThb')}</Label>
              <Input
                id="product-price"
                inputMode="decimal"
                min="0"
                placeholder="0.00"
                value={startingPriceThb}
                onChange={(event) => setStartingPriceThb(event.target.value)}
              />
              <p className="field-hint">{t('indicativePriceNote')}</p>
            </div>
            <div className="visibility-field">
              <input
                id="product-visible"
                type="checkbox"
                checked={visible}
                onChange={(event) => setVisible(event.target.checked)}
              />
              <Label htmlFor="product-visible">{t('visible')}</Label>
            </div>
          </Card>

          <div className="editor-columns">
            <Card className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <h2>{t('imagesEditor')}</h2>
                  <p>{t('productImages')}</p>
                </div>
                <label className="upload-button">
                  <Upload size={15} />
                  {t('uploadImages')}
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files ?? [])
                      setPendingImages((current) => [
                        ...current,
                        ...selectedFiles.map((file, index) => ({
                          id: `${file.name}-${file.lastModified}-${file.size}-${current.length + index}`,
                          file,
                        })),
                      ])
                      event.target.value = ''
                    }}
                    type="file"
                  />
                </label>
              </div>
              <p className="field-hint">
                {t('moveUp')} / {t('moveDown')}. {t('visible')}
              </p>
              {pendingImages.length > 0 ? (
                <p className="pending-files">
                  {pendingImages.length} {t('uploadImages')}
                </p>
              ) : null}
              <ol className="image-editor-list">
                {images.map((image, index) => (
                  <li key={image.id ?? image.objectKey}>
                    <div className="image-editor-thumb">
                      <img src={image.url} alt="" />
                      {index === 0 ? <span>{t('cover')}</span> : null}
                    </div>
                    <div className="image-editor-actions">
                      <Button
                        aria-label={t('moveUp')}
                        disabled={index === 0}
                        onClick={() => moveImage(index, -1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        ↑
                      </Button>
                      <Button
                        aria-label={t('moveDown')}
                        disabled={index === images.length - 1}
                        onClick={() => moveImage(index, 1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        ↓
                      </Button>
                      <Button
                        aria-label={t('remove')}
                        onClick={() =>
                          setImages((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </li>
                ))}
                {pendingImages.map((pendingImage, index) => (
                  <li className="pending-image-row" key={pendingImage.id}>
                    <div className="image-editor-thumb">
                      <span className="pending-image-name">
                        {pendingImage.file.name}
                      </span>
                      {images.length === 0 && index === 0 ? (
                        <span>{t('cover')}</span>
                      ) : null}
                    </div>
                    <div className="image-editor-actions">
                      <Button
                        aria-label={t('moveUp')}
                        disabled={index === 0}
                        onClick={() => movePendingImage(index, -1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        ↑
                      </Button>
                      <Button
                        aria-label={t('moveDown')}
                        disabled={index === pendingImages.length - 1}
                        onClick={() => movePendingImage(index, 1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        ↓
                      </Button>
                      <Button
                        aria-label={t('remove')}
                        onClick={() => {
                          setPendingImages((current) =>
                            current.filter(
                              (item) => item.id !== pendingImage.id,
                            ),
                          )
                        }}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <div className="editor-columns">
            <Card className="editor-card markdown-preview-card">
              <div className="editor-card-heading">
                <h2>{t('preview')}</h2>
              </div>
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownToHtml(description),
                }}
              />
            </Card>
          </div>
          <div className="editor-footer">
            <Button asChild type="button" variant="ghost">
              <Link to="/admin/catalog">{t('cancel')}</Link>
            </Button>
            <Button
              className="primary-button compact-button"
              disabled={saving}
              type="submit"
            >
              <Save size={16} />
              {saving
                ? t('saving')
                : isNew
                  ? t('createProduct')
                  : t('updateProduct')}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
