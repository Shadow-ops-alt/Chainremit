import { clusterApiUrl } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  mplBubblegum,
  mintToCollectionV1,
  parseLeafFromMintToCollectionV1Transaction,
} from '@metaplex-foundation/mpl-bubblegum'
import {
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
  type PublicKey,
} from '@metaplex-foundation/umi'
import { base58 } from '@metaplex-foundation/umi/serializers'
import { parseRelayerKeypair } from './keypair.js'

export async function mintReceiptNft(recipientWallet: string, amount: string, currency: string) {
  const treeAddress = process.env.MERKLE_TREE_ADDRESS
  const collectionMint = process.env.COLLECTION_MINT

  if (!treeAddress || !collectionMint) {
    console.warn('MERKLE_TREE_ADDRESS or COLLECTION_MINT not set; skipping receipt NFT mint')
    return null
  }

  const relayerKeypair = parseRelayerKeypair()
  if (!relayerKeypair) {
    console.warn('RELAYER_PRIVATE_KEY not set; skipping receipt NFT mint')
    return null
  }
  const relayerSecretKey = relayerKeypair.secretKey

  const umi = createUmi(process.env.SOLANA_RPC_URL ?? clusterApiUrl('devnet')).use(mplBubblegum())
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(relayerSecretKey)
  const signer = createSignerFromKeypair(umi, umiKeypair)
  umi.use(keypairIdentity(umiKeypair))
  umi.payer = signer
  const attributes = [
    { trait_type: 'Amount', value: amount },
    { trait_type: 'Currency', value: currency },
    { trait_type: 'Provider', value: 'ChainRemit' },
  ]

  const txResult = await mintToCollectionV1(umi, {
    leafOwner: publicKey(recipientWallet),
    merkleTree: publicKey(treeAddress),
    collectionMint: publicKey(collectionMint),
    metadata: {
      name: 'ChainRemit Receipt',
      symbol: 'CRMIT',
      uri:
        process.env.NFT_METADATA_URI ??
        'https://raw.githubusercontent.com/your-org/chainremit/main/nft-metadata.json',
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: signer.publicKey as PublicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      tokenProgramVersion: 0,
    },
  }).sendAndConfirm(umi)

  try {
    await parseLeafFromMintToCollectionV1Transaction(umi, txResult.signature)
  } catch {
    // Leaf parsing is best-effort only; signature is still useful for explorer.
  }

  console.info('Minted ChainRemit receipt cNFT', { recipientWallet, attributes })

  return base58.deserialize(txResult.signature)[0]
}
