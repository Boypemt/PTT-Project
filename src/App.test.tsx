import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'

describe('App', () => {
  it('renders the placeholder shell heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Pa Ton Phueng Customizer/i,
      }),
    ).toBeInTheDocument()
  })
})
