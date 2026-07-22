import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: "dark" | "light"
  rawTheme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  rawTheme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "dt-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [rawTheme, setRawTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    const initialTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme
    if (initialTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return initialTheme === "dark" ? "dark" : "light"
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.add("theme-transitioning")
    root.classList.remove("light", "dark")

    let activeTheme: "light" | "dark" = "light"
    if (rawTheme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    } else {
      activeTheme = rawTheme === "dark" ? "dark" : "light"
    }

    root.classList.add(activeTheme)
    setResolvedTheme(activeTheme)

    const timer = setTimeout(() => {
      root.classList.remove("theme-transitioning")
    }, 300)

    return () => clearTimeout(timer)
  }, [rawTheme])

  useEffect(() => {
    if (rawTheme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.add("theme-transitioning")
      root.classList.remove("light", "dark")
      const activeTheme = e.matches ? "dark" : "light"
      root.classList.add(activeTheme)
      setResolvedTheme(activeTheme)

      setTimeout(() => {
        root.classList.remove("theme-transitioning")
      }, 300)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [rawTheme])

  const value = {
    theme: resolvedTheme,
    rawTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setRawTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
