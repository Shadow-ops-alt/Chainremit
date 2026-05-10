import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, generateSigner, percentAmount } from '@metaplex-foundation/umi'
import { createTree, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum'
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { readFileSync } from 'fs'

const secret = JSON.parse(readFileSync('./relayer-keypair.json', 'utf8'))
const NFT_METADATA_URI = 'https://raw.githubusercontent.com/Shadow-ops-alt/chainremit/main/nft-metadata.json'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplBubblegum())
  .use(mplTokenMetadata())

const umiKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(secret))
umi.use(keypairIdentity(umiKeypair))

console.log('Creating Merkle tree (takes ~20 seconds)...')
const merkleTree = generateSigner(umi)
await (await createTree(umi, { merkleTree, maxDepth: 14, maxBufferSize: 64 })).sendAndConfirm(umi)
console.log('MERKLE_TREE_ADDRESS =', merkleTree.publicKey)

console.log('Creating collection NFT...')
const collectionMint = generateSigner(umi)
await createNft(umi, {
  mint: collectionMint,
  name: 'ChainRemit Receipts',
  symbol: 'CRMIT',
  uri: NFT_METADATA_URI,
  sellerFeeBasisPoints: percentAmount(0),
  isCollection: true,
}).sendAndConfirm(umi)
console.log('COLLECTION_MINT =', collectionMint.publicKey)

console.log('\n--- Copy these into Railway env vars ---')
console.log('MERKLE_TREE_ADDRESS=' + merkleTree.publicKey)
console.log('COLLECTION_MINT=' + collectionMint.publicKey)
console.log('NFT_METADATA_URI=' + NFT_METADATA_URI)
