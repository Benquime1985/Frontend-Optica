const defaultGeneralMessage = 'Hola, quiero conocer los productos y promociones de Óptica Vision Guinto.'

export const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER ?? ''
export const whatsappMessages = {
  general: import.meta.env.VITE_WHATSAPP_GENERAL_MESSAGE ?? defaultGeneralMessage,
  catalog: import.meta.env.VITE_WHATSAPP_CATALOG_MESSAGE ?? 'Hola, quiero conocer los productos disponibles.',
  promotion: import.meta.env.VITE_WHATSAPP_PROMOTION_MESSAGE ?? 'Hola, quiero conocer las promociones vigentes.',
}

export function whatsappUrl(message?: string) {
  const url = `https://wa.me/${whatsappNumber}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}
