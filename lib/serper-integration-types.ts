export type SerperPublicSettings = {
  configured: boolean
  maskedKey: string | null
}

export type SerperImageResult = {
  title: string
  imageUrl: string
  thumbnailUrl: string | null
  source: string | null
  domain: string | null
  imageWidth: number | null
  imageHeight: number | null
}
