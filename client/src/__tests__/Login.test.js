import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Login from '../pages/Login'

// Mock p5 and vanta to avoid canvas issues
jest.mock('p5', () => jest.fn())
jest.mock('vanta/dist/vanta.trunk.min', () => jest.fn())

jest.mock('axios')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

const mockAxios = axios

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText('Selamat Datang')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Masukkan Email Anda')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Masukkan Password')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  test('shows error when fields are empty', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const submitButton = screen.getByText('Sign in')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Semua field wajib diisi.')).toBeInTheDocument()
    })
  })

  test('submits form with valid data', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: { ok: true } })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText('Masukkan Email Anda')
    const passwordInput = screen.getByPlaceholderText('Masukkan Password')
    const submitButton = screen.getByText('Sign in')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/login',
        { identifier: 'test@example.com', password: 'password123' },
        { withCredentials: true }
      )
    })
  })

  test('shows error on login failure', async () => {
    const errorMessage = 'Invalid credentials'
    mockAxios.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText('Masukkan Email Anda')
    const passwordInput = screen.getByPlaceholderText('Masukkan Password')
    const submitButton = screen.getByText('Sign in')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  test('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const passwordInput = screen.getByPlaceholderText('Masukkan Password')
    const toggleButtons = screen.getAllByRole('button')
    const toggleButton = toggleButtons.find(button => button.classList.contains('ml-2'))

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again to hide
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
