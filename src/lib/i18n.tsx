import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const locales = ['th', 'en'] as const
export type Locale = (typeof locales)[number]

const translations = {
  th: {
    languageName: 'English',
    languageAction: 'Switch to English',
    publicNav: 'ช่อดอกไม้',
    publicKicker: 'VERABLOOM FLOWER STUDIO',
    publicTitle: 'ดอกไม้สำหรับทุกความรู้สึก',
    publicBody:
      'เลือกชมช่อดอกไม้ที่ค่อย ๆ จัดด้วยสีสัน เนื้อสัมผัส และเรื่องราวของคุณ',
    publicCta: 'ชมแคตตาล็อกเร็ว ๆ นี้',
    publicNote: 'เรากำลังจัดดอกไม้ช่อแรกของแคตตาล็อก',
    adminSignIn: 'เข้าสู่ระบบผู้ดูแล',
    loginKicker: 'พื้นที่จัดการร้าน',
    loginTitle: 'ยินดีต้อนรับกลับ',
    loginBody: 'เข้าสู่ระบบด้วยบัญชีกลางของทีม Verabloom',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ…',
    invalidCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    backToShop: 'กลับหน้าร้าน',
    adminBrand: 'Verabloom Admin',
    adminOverview: 'ภาพรวมร้าน',
    adminWelcome: 'ยินดีต้อนรับ ทีม Verabloom',
    adminBody:
      'พื้นที่ทำงานพร้อมแล้วสำหรับแคตตาล็อก คำขอ และการเงินในขั้นถัดไป',
    adminStatus: 'ระบบพร้อมใช้งาน',
    adminProtected: 'เฉพาะทีมผู้ดูแล',
    logout: 'ออกจากระบบ',
    catalog: 'แคตตาล็อก',
    catalogTitle: 'ช่อดอกไม้ของเรา',
    catalogIntro: 'เลือกชมดีไซน์ที่จัดไว้สำหรับทุกโอกาส',
    variationFilter: 'กรองตามรูปแบบ',
    allVariations: 'ทุกรูปแบบ',
    clearFilter: 'ล้างตัวกรอง',
    noProducts: 'ยังไม่มีช่อดอกไม้ที่เปิดให้ชม',
    viewProduct: 'ดูรายละเอียด',
    backToCatalog: 'กลับไปแคตตาล็อก',
    productDetails: 'รายละเอียดช่อดอกไม้',
    variations: 'รูปแบบที่มีให้เลือก',
    startingPrice: 'ราคาเริ่มต้น',
    indicativePriceNote:
      'ราคาเริ่มต้นเป็นราคาโดยประมาณ ราคาสุดท้ายยืนยันเมื่อสั่งซื้อ',
    noStartingPrice: 'สอบถามราคา',
    productImages: 'ภาพช่อดอกไม้',
    requestBouquet: 'ขอช่อนี้',
    requestProduct: 'ส่งคำขอช่อดอกไม้',
    requestTitle: 'ส่งคำขอช่อดอกไม้',
    requestIntro: 'กรอกรายละเอียดเพื่อให้เราติดต่อกลับและยืนยันคำขอของคุณ',
    selectedProduct: 'ช่อดอกไม้ที่เลือก',
    selectedVariation: 'รูปแบบที่เลือก',
    quantity: 'จำนวน',
    customerName: 'ชื่อผู้ติดต่อ',
    socialChannel: 'ช่องทางติดต่อ',
    socialContact: 'ไอดีหรือข้อมูลติดต่อ',
    line: 'LINE',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    phone: 'เบอร์โทรศัพท์ (ไม่บังคับ)',
    requestDetails: 'รายละเอียดคำขอ',
    requestDetailsHint:
      'สี ดอกไม้ กระดาษห่อ ข้อความในการ์ด หรือความต้องการอื่น ๆ',
    deliveryMethod: 'วิธีรับช่อดอกไม้',
    postal: 'ไปรษณีย์',
    messenger: 'แมสเซนเจอร์',
    collection: 'รับที่ร้าน',
    orderAddress: 'ที่อยู่จัดส่ง',
    requiredDate: 'ส่งภายในวันที่',
    submitRequest: 'ส่งคำขอ',
    submittingRequest: 'กำลังส่งคำขอ…',
    requestSubmitted: 'ส่งคำขอเรียบร้อยแล้ว',
    requestReference: 'เลขอ้างอิงคำขอ',
    screenshotInstruction:
      'กรุณาถ่ายภาพหน้าจอนี้เก็บไว้เป็นหลักฐานสำหรับการติดต่อกับเรา',
    contactUs: 'ติดต่อเราได้ที่',
    backToProduct: 'กลับไปดูช่อดอกไม้',
    requestSubmitError: 'ส่งคำขอไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง',
    invalidProduct: 'ไม่พบช่อดอกไม้นี้หรือช่อดอกไม้ไม่เปิดให้ขอแล้ว',
    requiredField: 'กรุณากรอกข้อมูลนี้',
    invalidQuantity: 'กรุณาระบุจำนวนเต็มที่มากกว่าศูนย์',
    invalidDate: 'กรุณาระบุวันที่ให้ถูกต้อง',
    deliveryAddressRequired: 'กรุณากรอกที่อยู่สำหรับการจัดส่ง',
    adminCatalog: 'จัดการแคตตาล็อก',
    addProduct: 'เพิ่มช่อดอกไม้',
    editProduct: 'แก้ไขช่อดอกไม้',
    productName: 'ชื่อช่อดอกไม้',
    description: 'คำอธิบาย (Markdown)',
    visibility: 'การแสดงผล',
    visible: 'แสดงในแคตตาล็อก',
    hidden: 'ซ่อนจากแคตตาล็อก',
    markdownGuide:
      'ใช้ **ตัวหนา**, *ตัวเอียง*, - รายการ และ [ลิงก์](https://example.com)',
    preview: 'ตัวอย่าง',
    variationsEditor: 'รูปแบบและราคาเริ่มต้น',
    variationName: 'ชื่อรูปแบบ',
    priceThb: 'ราคาเริ่มต้น (บาท)',
    addVariation: 'เพิ่มรูปแบบ',
    remove: 'ลบ',
    imagesEditor: 'ภาพสินค้า',
    uploadImages: 'เพิ่มภาพ',
    moveUp: 'เลื่อนขึ้น',
    moveDown: 'เลื่อนลง',
    save: 'บันทึก',
    saving: 'กำลังบันทึก…',
    cancel: 'ยกเลิก',
    createProduct: 'สร้างช่อดอกไม้',
    updateProduct: 'บันทึกการแก้ไข',
    productSaved: 'บันทึกช่อดอกไม้แล้ว',
    showProduct: 'แสดงสินค้า',
    hideProduct: 'ซ่อนสินค้า',
    reorderSaved: 'บันทึกลำดับแล้ว',
    emptyDescription: 'ยังไม่มีคำอธิบาย',
    cover: 'ภาพปก',
  },
  en: {
    languageName: 'ไทย',
    languageAction: 'เปลี่ยนเป็นภาษาไทย',
    publicNav: 'Bouquets',
    publicKicker: 'VERABLOOM FLOWER STUDIO',
    publicTitle: 'Flowers for every feeling',
    publicBody:
      'Discover bouquets composed around your colors, textures, and story.',
    publicCta: 'Catalog coming soon',
    publicNote: 'We are arranging the first bouquets for the catalog.',
    adminSignIn: 'Admin sign in',
    loginKicker: 'Shop workspace',
    loginTitle: 'Welcome back',
    loginBody: "Sign in with Verabloom's shared team account.",
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    invalidCredentials: 'The email or password is incorrect',
    backToShop: 'Back to shop',
    adminBrand: 'Verabloom Admin',
    adminOverview: 'Shop overview',
    adminWelcome: 'Welcome, Verabloom team',
    adminBody:
      'The workspace is ready for catalog, request, and finance features in the next phases.',
    adminStatus: 'System ready',
    adminProtected: 'Admin team only',
    logout: 'Log out',
    catalog: 'Catalog',
    catalogTitle: 'Our bouquets',
    catalogIntro: 'Browse designs arranged for every occasion.',
    variationFilter: 'Filter by variation',
    allVariations: 'All variations',
    clearFilter: 'Clear filter',
    noProducts: 'No visible bouquets yet',
    viewProduct: 'View details',
    backToCatalog: 'Back to catalog',
    productDetails: 'Bouquet details',
    variations: 'Available variations',
    startingPrice: 'Starting price',
    indicativePriceNote:
      'Starting prices are indicative. We confirm the final price when you request an order.',
    noStartingPrice: 'Ask for price',
    productImages: 'Bouquet images',
    requestBouquet: 'Request this bouquet',
    requestProduct: 'Send a bouquet request',
    requestTitle: 'Send a bouquet request',
    requestIntro:
      'Share the details and we will follow up to confirm your request.',
    selectedProduct: 'Selected bouquet',
    selectedVariation: 'Selected variation',
    quantity: 'Quantity',
    customerName: 'Your name',
    socialChannel: 'Contact channel',
    socialContact: 'Channel contact',
    line: 'LINE',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    phone: 'Phone (optional)',
    requestDetails: 'Request details',
    requestDetailsHint:
      'Colors, flowers, wrapping, card text, or other preferences',
    deliveryMethod: 'Delivery method',
    postal: 'Postal delivery',
    messenger: 'Messenger delivery',
    collection: 'Collection',
    orderAddress: 'Delivery address',
    requiredDate: 'Required by date',
    submitRequest: 'Submit request',
    submittingRequest: 'Submitting…',
    requestSubmitted: 'Request submitted',
    requestReference: 'Request reference',
    screenshotInstruction:
      'Please capture a screenshot of this page as your reference when you contact us.',
    contactUs: 'Continue the conversation',
    backToProduct: 'Back to bouquet',
    requestSubmitError:
      'We could not submit your request. Check the details and try again.',
    invalidProduct:
      'This bouquet was not found or is no longer available for requests.',
    requiredField: 'Please complete this field',
    invalidQuantity: 'Enter a positive whole number',
    invalidDate: 'Enter a valid date',
    deliveryAddressRequired: 'Enter an address for delivery',
    adminCatalog: 'Catalog management',
    addProduct: 'Add bouquet',
    editProduct: 'Edit bouquet',
    productName: 'Bouquet name',
    description: 'Description (Markdown)',
    visibility: 'Visibility',
    visible: 'Show in catalog',
    hidden: 'Hidden from catalog',
    markdownGuide:
      'Use **bold**, *italic*, - list items, and [links](https://example.com)',
    preview: 'Preview',
    variationsEditor: 'Variations and starting prices',
    variationName: 'Variation name',
    priceThb: 'Starting price (THB)',
    addVariation: 'Add variation',
    remove: 'Remove',
    imagesEditor: 'Product images',
    uploadImages: 'Add images',
    moveUp: 'Move up',
    moveDown: 'Move down',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    createProduct: 'Create bouquet',
    updateProduct: 'Save changes',
    productSaved: 'Bouquet saved',
    showProduct: 'Show product',
    hideProduct: 'Hide product',
    reorderSaved: 'Order saved',
    emptyDescription: 'No description yet',
    cover: 'Cover',
  },
} as const

export type MessageKey = keyof (typeof translations)['th']

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocale] = useState(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dataset.hydrated = 'true'
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key) => translations[locale][key] }),
    [locale],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
