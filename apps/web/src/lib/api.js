import { createApiClient } from '@freshmeat/api-client'

const client = createApiClient(import.meta.env.VITE_API_BASE || '')

export const { analyzeImage, createBatch, fetchBatches, fetchHistory } = client
