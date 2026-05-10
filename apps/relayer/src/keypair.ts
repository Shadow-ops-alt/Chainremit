import { Keypair } from '@solana/web3.js'

export function parseRelayerKeypair(): Keypair | null {
  const raw = process.env.RELAYER_PRIVATE_KEY
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('RELAYER_PRIVATE_KEY must be a valid JSON array')
  }
  if (!Array.isArray(parsed)) throw new Error('RELAYER_PRIVATE_KEY must be a JSON array')
  return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]))
}
