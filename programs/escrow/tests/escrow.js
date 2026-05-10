const anchor = require("@coral-xyz/anchor");
const { SystemProgram } = anchor.web3;
const crypto = require("node:crypto");

describe("escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  it("Create -> claim works (SOL escrow)", async () => {
    const program = anchor.workspace.escrow;
    const provider = anchor.getProvider();

    const sender = provider.wallet.payer;
    const receiver = anchor.web3.Keypair.generate();

    // airdrop receiver to pay fees
    const sig = await provider.connection.requestAirdrop(receiver.publicKey, 2e9);
    await provider.connection.confirmTransaction(sig, "confirmed");

    const escrowId = crypto.randomBytes(16);
    const claimToken = crypto.randomBytes(32);
    const claimHash = crypto.createHash("sha256").update(claimToken).digest();
    const amount = new anchor.BN(0.25 * anchor.web3.LAMPORTS_PER_SOL);

    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), sender.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );

    await program.methods
      .createEscrow(Array.from(escrowId), Array.from(claimHash), amount)
      .accounts({
        sender: sender.publicKey,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const before = await provider.connection.getBalance(receiver.publicKey, "confirmed");

    await program.methods
      .claimEscrow(Array.from(claimToken))
      .accounts({
        receiver: receiver.publicKey,
        sender: sender.publicKey,
        escrow: escrowPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([receiver])
      .rpc();

    const after = await provider.connection.getBalance(receiver.publicKey, "confirmed");
    if (after <= before) throw new Error("receiver did not receive funds");
  });

  it("Create -> cancel returns funds to sender", async () => {
    const program = anchor.workspace.escrow;
    const provider = anchor.getProvider();
    const sender = provider.wallet.payer;

    const escrowId = crypto.randomBytes(16);
    const claimToken = crypto.randomBytes(32);
    const claimHash = crypto.createHash("sha256").update(claimToken).digest();
    const amount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);

    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), sender.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );

    const before = await provider.connection.getBalance(sender.publicKey, "confirmed");

    await program.methods
      .createEscrow(Array.from(escrowId), Array.from(claimHash), amount)
      .accounts({ sender: sender.publicKey, escrow: escrowPda, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    await program.methods
      .cancelEscrow()
      .accounts({ sender: sender.publicKey, escrow: escrowPda, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    const after = await provider.connection.getBalance(sender.publicKey, "confirmed");
    if (after <= before - 0.01 * anchor.web3.LAMPORTS_PER_SOL) {
      throw new Error("sender did not get funds back after cancel");
    }
  });

  it("Claim with wrong token is rejected", async () => {
    const program = anchor.workspace.escrow;
    const provider = anchor.getProvider();
    const sender = provider.wallet.payer;
    const receiver = anchor.web3.Keypair.generate();

    const sig = await provider.connection.requestAirdrop(receiver.publicKey, 1e9);
    await provider.connection.confirmTransaction(sig, "confirmed");

    const escrowId = crypto.randomBytes(16);
    const claimToken = crypto.randomBytes(32);
    const wrongToken = crypto.randomBytes(32);
    const claimHash = crypto.createHash("sha256").update(claimToken).digest();
    const amount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);

    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), sender.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );

    await program.methods
      .createEscrow(Array.from(escrowId), Array.from(claimHash), amount)
      .accounts({ sender: sender.publicKey, escrow: escrowPda, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    let threw = false;
    try {
      await program.methods
        .claimEscrow(Array.from(wrongToken))
        .accounts({ receiver: receiver.publicKey, sender: sender.publicKey, escrow: escrowPda, systemProgram: anchor.web3.SystemProgram.programId })
        .signers([receiver])
        .rpc();
    } catch (e) {
      threw = true;
    }
    if (!threw) throw new Error("expected invalid token to be rejected");

    // Cleanup — cancel so funds aren't stuck
    await program.methods
      .cancelEscrow()
      .accounts({ sender: sender.publicKey, escrow: escrowPda, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();
  });
});
