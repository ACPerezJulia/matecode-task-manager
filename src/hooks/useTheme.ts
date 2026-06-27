import { useState, useLayoutEffect } from 'react'
import type { Theme } from '../types'

const KEY = 'matecode-theme'

// Migra nombres viejos (light→classic, dark→midnight, vibrant→gradient)
// para que usuarios con tema guardado no pierdan su preferencia.
const MIGRATE: Record<string, Theme> = {
  light: 'classic',
  dark: 'midnight',
  vibrant: 'gradient',
}

function getInitialTheme(): Theme {
  let stored = localStorage.getItem(KEY)
  if (stored && MIGRATE[stored]) {
    stored = MIGRATE[stored]
    localStorage.setItem(KEY, stored)
  }
  if (stored === 'classic' || stored === 'midnight' || stored === 'gradient') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'midnight'
    : 'classic'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  return { theme, setTheme: (t: Theme) => setThemeState(t) }
}
