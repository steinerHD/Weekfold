import { useEffect, useState } from 'react'

const THEME_KEY = 'weekfold-theme'

function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark'
}

export function useTheme() {
  const [isDark, setIsDark] = useState(getSavedTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  return { isDark, toggleTheme: () => setIsDark((value) => !value) }
}
