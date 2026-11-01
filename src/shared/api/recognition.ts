import client from './client'

/** Shared by Quick Facts and trend preview/recognition flows. */
export async function submitRecognize(requestData: FormData): Promise<unknown> {
  const res = await client.post('/sqf/recognize', requestData)
  return res.data
}
