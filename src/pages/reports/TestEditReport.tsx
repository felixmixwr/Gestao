import React from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'

export default function TestEditReport() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Teste - Editar Relatório</h1>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/reports'}
          >
            Voltar
          </Button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Teste de Componentes</h2>
          <p className="text-gray-600 mb-4">
            Esta é uma página de teste para verificar se os componentes estão funcionando corretamente.
          </p>
          
          <div className="space-y-4">
            <Button variant="primary">Botão Primário</Button>
            <Button variant="outline">Botão Outline</Button>
            <Button variant="secondary">Botão Secondary</Button>
            <Button variant="danger">Botão Danger</Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
