// Script para testar a VAPID key
const VAPID_PUBLIC_KEY = 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA'

console.log('🔑 Testando VAPID Public Key...')
console.log('📏 Tamanho da chave:', VAPID_PUBLIC_KEY.length)
console.log('📝 Chave original:', VAPID_PUBLIC_KEY)

function urlBase64ToUint8Array(base64String) {
  try {
    // Remover espaços e quebras de linha
    const cleanBase64 = base64String.trim().replace(/\s/g, '')
    
    // Adicionar padding se necessário
    const padding = '='.repeat((4 - cleanBase64.length % 4) % 4)
    const base64 = (cleanBase64 + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    console.log('✅ VAPID key convertida com sucesso')
    console.log('📏 Tamanho do array:', outputArray.length)
    console.log('🔢 Primeiros bytes:', Array.from(outputArray.slice(0, 10)))
    return outputArray
  } catch (error) {
    console.error('❌ Erro ao converter VAPID key:', error)
    throw error
  }
}

try {
  const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  console.log('🎉 VAPID key está no formato correto!')
  
  // Verificar se o tamanho está correto (deve ser 65 bytes para chave P-256)
  if (convertedKey.length === 65) {
    console.log('✅ Tamanho da chave está correto (65 bytes)')
  } else {
    console.warn('⚠️ Tamanho da chave pode estar incorreto:', convertedKey.length, 'bytes')
  }
  
} catch (error) {
  console.error('💥 Falha na conversão da VAPID key:', error.message)
}
