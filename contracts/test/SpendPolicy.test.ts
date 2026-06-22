const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const MANDATE_TYPES = {
  PaymentMandate: [
    { name: "payer", type: "address" },
    { name: "merchant", type: "address" },
    { name: "token", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "maxPerCharge", type: "uint256" },
    { name: "maxPerDay", type: "uint256" },
    { name: "totalCap", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

describe("SpendPolicy", function () {
  async function deployFixture() {
    const [owner, merchant, payer, relayer, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockUSDCPermit");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const SpendPolicy = await ethers.getContractFactory("SpendPolicy");
    const policy = await SpendPolicy.deploy();
    await policy.waitForDeployment();

    const { chainId } = await ethers.provider.getNetwork();
    const policyAddress = await policy.getAddress();
    const tokenAddress = await token.getAddress();

    return { policy, policyAddress, token, tokenAddress, chainId, owner, merchant, payer, relayer, other };
  }

  async function buildMandate(ctx: any, overrides: any = {}) {
    const latest = await ethers.provider.getBlock("latest");
    const mandate = {
      payer: ctx.payer.address,
      merchant: ctx.merchant.address,
      token: ctx.tokenAddress,
      chainId: overrides.chainId ?? ctx.chainId,
      maxPerCharge: overrides.maxPerCharge ?? 1_000_000n,
      maxPerDay: overrides.maxPerDay ?? 2_000_000n,
      totalCap: overrides.totalCap ?? 5_000_000n,
      expiry: overrides.expiry ?? BigInt(latest!.timestamp + 3600),
      nonce: overrides.nonce ?? ethers.hexlify(ethers.randomBytes(32)),
    };
    const domain = {
      name: "OneLink Pay",
      version: "1",
      chainId: ctx.chainId,
      verifyingContract: ctx.policyAddress,
    };
    const signature = await ctx.payer.signTypedData(domain, MANDATE_TYPES, mandate);
    return { mandate, signature };
  }

  async function fund(ctx: any, amount: bigint) {
    await ctx.token.mint(ctx.payer.address, amount);
    await ctx.token.connect(ctx.payer).approve(ctx.policyAddress, amount);
  }

  it("charges within the mandate, transfers exactly, and emits proof", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 5_000_000n);
    const { mandate, signature } = await buildMandate(ctx);

    await expect(ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n))
      .to.emit(ctx.policy, "MandateCharged");

    expect(await ctx.token.balanceOf(ctx.merchant.address)).to.equal(1_000_000n);
    const id = await ctx.policy.hashMandate(mandate);
    const state = await ctx.policy.getMandateState(id);
    expect(state.spentTotal).to.equal(1_000_000n);
  });

  it("blocks a charge above the per-charge cap", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 5_000_000n);
    const { mandate, signature } = await buildMandate(ctx, { maxPerCharge: 1_000_000n });

    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_500_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "PerChargeExceeded");
    expect(await ctx.token.balanceOf(ctx.merchant.address)).to.equal(0n);
  });

  it("enforces the rolling daily cap and resets after 24h", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 10_000_000n);
    const latest = await ethers.provider.getBlock("latest");
    const { mandate, signature } = await buildMandate(ctx, {
      maxPerCharge: 1_000_000n,
      maxPerDay: 1_500_000n,
      totalCap: 10_000_000n,
      expiry: BigInt(latest!.timestamp + 7 * 86_400),
    });

    await ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n);
    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "DailyCapExceeded");

    // advance 24h + 1s -> daily window resets
    await network.provider.send("evm_increaseTime", [86_401]);
    await network.provider.send("evm_mine");

    await expect(ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n)).to.emit(
      ctx.policy,
      "MandateCharged"
    );
    expect(await ctx.token.balanceOf(ctx.merchant.address)).to.equal(2_000_000n);
  });

  it("enforces the lifetime total cap", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 10_000_000n);
    const { mandate, signature } = await buildMandate(ctx, {
      maxPerCharge: 2_000_000n,
      maxPerDay: 10_000_000n,
      totalCap: 3_000_000n,
    });

    await ctx.policy.connect(ctx.relayer).charge(mandate, signature, 2_000_000n);
    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, signature, 2_000_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "TotalCapExceeded");
  });

  it("rejects charges after expiry", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 5_000_000n);
    const latest = await ethers.provider.getBlock("latest");
    const { mandate, signature } = await buildMandate(ctx, { expiry: BigInt(latest!.timestamp + 100) });

    await network.provider.send("evm_increaseTime", [200]);
    await network.provider.send("evm_mine");

    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "MandateExpired");
  });

  it("lets the payer revoke; charges then revert; non-payer cannot revoke", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 5_000_000n);
    const { mandate, signature } = await buildMandate(ctx);

    await expect(ctx.policy.connect(ctx.other).revoke(mandate)).to.be.revertedWithCustomError(
      ctx.policy,
      "NotPayer"
    );

    await expect(ctx.policy.connect(ctx.payer).revoke(mandate)).to.emit(ctx.policy, "MandateRevoked");

    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "MandateIsRevoked");
  });

  it("rejects a forged signature (signed by someone other than the payer)", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 5_000_000n);
    const latest = await ethers.provider.getBlock("latest");
    const mandate = {
      payer: ctx.payer.address,
      merchant: ctx.merchant.address,
      token: ctx.tokenAddress,
      chainId: ctx.chainId,
      maxPerCharge: 1_000_000n,
      maxPerDay: 2_000_000n,
      totalCap: 5_000_000n,
      expiry: BigInt(latest!.timestamp + 3600),
      nonce: ethers.hexlify(ethers.randomBytes(32)),
    };
    const domain = { name: "OneLink Pay", version: "1", chainId: ctx.chainId, verifyingContract: ctx.policyAddress };
    const forged = await ctx.other.signTypedData(domain, MANDATE_TYPES, mandate);

    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, forged, 1_000_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "BadSignature");
  });

  it("rejects a mandate for a different chain", async function () {
    const ctx = await deployFixture();
    await fund(ctx, 5_000_000n);
    const { mandate, signature } = await buildMandate(ctx, { chainId: 999999n });

    await expect(
      ctx.policy.connect(ctx.relayer).charge(mandate, signature, 1_000_000n)
    ).to.be.revertedWithCustomError(ctx.policy, "WrongChain");
  });

  it("chargeWithPermit sets the allowance gaslessly and charges in one call", async function () {
    const ctx = await deployFixture();
    await ctx.token.mint(ctx.payer.address, 5_000_000n); // no approve — permit will set it
    const { mandate, signature } = await buildMandate(ctx);

    const latest = await ethers.provider.getBlock("latest");
    const deadline = BigInt(latest!.timestamp + 3600);
    const permitNonce = await ctx.token.nonces(ctx.payer.address);
    const permitDomain = {
      name: "Mock USD Coin",
      version: "1",
      chainId: ctx.chainId,
      verifyingContract: ctx.tokenAddress,
    };
    const permitTypes = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const permitValue = {
      owner: ctx.payer.address,
      spender: ctx.policyAddress,
      value: 5_000_000n,
      nonce: permitNonce,
      deadline,
    };
    const permitSig = await ctx.payer.signTypedData(permitDomain, permitTypes, permitValue);
    const sig = ethers.Signature.from(permitSig);

    await expect(
      ctx.policy
        .connect(ctx.relayer)
        .chargeWithPermit(mandate, signature, 1_000_000n, {
          value: 5_000_000n,
          deadline,
          v: sig.v,
          r: sig.r,
          s: sig.s,
        })
    ).to.emit(ctx.policy, "MandateCharged");

    expect(await ctx.token.balanceOf(ctx.merchant.address)).to.equal(1_000_000n);
  });
});
