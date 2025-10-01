import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../lib/auth-hooks'
import { loginSchema, type LoginFormData } from '../../utils/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import { APP_CONFIG } from '../../utils/constants'

export function Login() {
  const { user, signIn, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      await signIn(data.email, data.password)
    } catch (error) {
      // Error is handled in the auth context
      console.error('Login failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-6 w-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {APP_CONFIG.COMPANY_NAME} - {APP_CONFIG.SECONDARY_COMPANY_NAME}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            
            <FormField
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
            >
              Entrar
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
