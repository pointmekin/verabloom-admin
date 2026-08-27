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
