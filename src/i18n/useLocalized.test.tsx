import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Localized } from '@/catalog'
import i18n from './index'
import { useLocalized } from './useLocalized'

const name: Localized = { th: 'ผ้าเช็ดหน้า', en: 'Handkerchief' }

function Readout() {
  const localized = useLocalized()

  return <output>{localized(name)}</output>
}

describe('useLocalized', () => {
  it('picks the Thai field by default', () => {
    render(<Readout />)

    expect(screen.getByRole('status')).toHaveTextContent(name.th)
  })

  it('picks the English field once the language changes', async () => {
    render(<Readout />)

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(screen.getByRole('status')).toHaveTextContent(name.en)
  })

  it('falls back to Thai for a language it does not know', async () => {
    render(<Readout />)

    await act(async () => {
      await i18n.changeLanguage('fr')
    })

    expect(screen.getByRole('status')).toHaveTextContent(name.th)
  })
})
