import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../lib/auth-hooks'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import { APP_CONFIG } from '../../utils/constants'
import { z } from 'zod'

// Schema para validação de cadastro
const signupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
})

type SignupFormData = z.infer<typeof signupSchema>

export function Signup() {
  const { user, signUp, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsSubmitting(true)
      await signUp(data.email, data.password, {
        full_name: data.fullName
      })
    } catch (error) {
      console.error('Signup failed:', error)
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {APP_CONFIG.COMPANY_NAME} - {APP_CONFIG.SECONDARY_COMPANY_NAME}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField
              label="Nome Completo"
              type="text"
              autoComplete="name"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <FormField
              label="Nome da Empresa"
              type="text"
              autoComplete="organization"
              required
              error={errors.companyName?.message}
              {...register('companyName')}
            />
            
            <FormField
              label="Senha"
              type="password"
              autoComplete="new-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <FormField
              label="Confirmar Senha"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
            >
              Criar Conta
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Faça login aqui
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}


