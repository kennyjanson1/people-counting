"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem storageKey="theme" {...props}>
      {children}
    </NextThemesProvider>
  )
}

export { useTheme }
