const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("ReceiptEmitter", function () {
  async function deployFixture() {
    const [owner, merchant, payer, other] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy();
    await token.waitForDeployment();

    const ReceiptEmitter = await ethers.getContractFactory("ReceiptEmitter");
    const receipt = await ReceiptEmitter.deploy(owner.address);
    await receipt.waitForDeployment();

    return { receipt, token, owner, merchant, payer, other };
  }

  async function registerInvoice(overrides: any = {}) {
    const fixture = await deployFixture();
    const invoiceId = overrides.invoiceId ?? ethers.id("invoice-001");
    const amount = overrides.amount ?? 1_000_000n;
    const latest = await ethers.provider.getBlock("latest");
    const deadline = overrides.deadline ?? BigInt(latest!.timestamp + 3600);

    await fixture.receipt.registerInvoice(
      invoiceId,
      overrides.merchant ?? fixture.merchant.address,
      overrides.token ?? (await fixture.token.getAddress()),
      amount,
      deadline
    );

    return { ...fixture, invoiceId, amount, deadline };
  }

  it("registerInvoice stores invoice fields and emits event", async function () {
    const { receipt, token, merchant } = await deployFixture();
    const invoiceId = ethers.id("registerInvoice_sets_invoice_fields");
    const amount = 250_000n;
    const latest = await ethers.provider.getBlock("latest");
    const deadline = BigInt(latest!.timestamp + 3600);
    const tokenAddress = await token.getAddress();

    await expect(receipt.registerInvoice(invoiceId, merchant.address, tokenAddress, amount, deadline))
      .to.emit(receipt, "InvoiceRegistered")
      .withArgs(invoiceId, merchant.address, tokenAddress, amount, deadline);

    const stored = await receipt.getInvoice(invoiceId);
    expect(stored.invoiceId).to.equal(invoiceId);
    expect(stored.merchant).to.equal(merchant.address);
    expect(stored.token).to.equal(tokenAddress);
    expect(stored.amount).to.equal(amount);
    expect(stored.deadline).to.equal(deadline);
    expect(stored.paid).to.equal(false);
    expect(stored.paymentTxHash).to.equal(ethers.ZeroHash);
  });

  it("registerInvoice is onlyOwner", async function () {
    const { receipt, token, merchant, other } = await deployFixture();
    const latest = await ethers.provider.getBlock("latest");

    await expect(
      receipt.connect(other).registerInvoice(
        ethers.id("registerInvoice_onlyOwner"),
        merchant.address,
        await token.getAddress(),
        1_000_000n,
        BigInt(latest!.timestamp + 3600)
      )
    ).to.be.revertedWithCustomError(receipt, "OwnableUnauthorizedAccount");
  });

  it("payInvoice transfers exact amount, marks paid, and emits event", async function () {
    const { receipt, token, merchant, payer, invoiceId, amount } = await registerInvoice();

    await token.mint(payer.address, amount);
    await token.connect(payer).approve(await receipt.getAddress(), amount);

    await expect(receipt.connect(payer).payInvoice(invoiceId))
      .to.emit(receipt, "InvoicePaid")
      .withArgs(
        invoiceId,
        merchant.address,
        payer.address,
        await token.getAddress(),
        amount,
        31337n,
        (timestamp: bigint) => timestamp > 0n
      );

    expect(await token.balanceOf(merchant.address)).to.equal(amount);
    expect(await token.balanceOf(payer.address)).to.equal(0n);
    expect(await receipt.isPaid(invoiceId)).to.equal(true);

    const stored = await receipt.getInvoice(invoiceId);
    expect(stored.payer).to.equal(payer.address);
    expect(stored.paidAt).to.be.greaterThan(0n);
    expect(stored.paymentTxHash).to.equal(ethers.ZeroHash);
  });

  it("recordVerifiedPayment marks paid, stores payment tx hash, and emits event", async function () {
    const { receipt, token, owner, merchant, payer, invoiceId, amount } = await registerInvoice();
    const paymentTxHash = ethers.keccak256(ethers.toUtf8Bytes("base-usdc-transfer-tx"));

    await expect(receipt.connect(owner).recordVerifiedPayment(invoiceId, payer.address, paymentTxHash))
      .to.emit(receipt, "InvoicePaid")
      .withArgs(
        invoiceId,
        merchant.address,
        payer.address,
        await token.getAddress(),
        amount,
        31337n,
        (timestamp: bigint) => timestamp > 0n
      );

    expect(await receipt.isPaid(invoiceId)).to.equal(true);

    const stored = await receipt.getInvoice(invoiceId);
    expect(stored.payer).to.equal(payer.address);
    expect(stored.paidAt).to.be.greaterThan(0n);
    expect(stored.paymentTxHash).to.equal(paymentTxHash);
  });

  it("recordVerifiedPayment is onlyOwner", async function () {
    const { receipt, payer, other, invoiceId } = await registerInvoice();

    await expect(
      receipt.connect(other).recordVerifiedPayment(invoiceId, payer.address, ethers.id("tx"))
    ).to.be.revertedWithCustomError(receipt, "OwnableUnauthorizedAccount");
  });

  it("payInvoice reverts if already paid", async function () {
    const { receipt, token, payer, invoiceId, amount } = await registerInvoice();

    await token.mint(payer.address, amount * 2n);
    await token.connect(payer).approve(await receipt.getAddress(), amount * 2n);
    await receipt.connect(payer).payInvoice(invoiceId);

    await expect(receipt.connect(payer).payInvoice(invoiceId)).to.be.revertedWithCustomError(
      receipt,
      "InvoiceAlreadyPaid"
    );
  });

  it("recordVerifiedPayment reverts if already paid", async function () {
    const { receipt, owner, payer, invoiceId } = await registerInvoice();

    await receipt.connect(owner).recordVerifiedPayment(invoiceId, payer.address, ethers.id("tx-1"));

    await expect(
      receipt.connect(owner).recordVerifiedPayment(invoiceId, payer.address, ethers.id("tx-2"))
    ).to.be.revertedWithCustomError(receipt, "InvoiceAlreadyPaid");
  });

  it("payInvoice reverts if invoice is missing", async function () {
    const { receipt, payer } = await deployFixture();

    await expect(receipt.connect(payer).payInvoice(ethers.id("missing"))).to.be.revertedWithCustomError(
      receipt,
      "InvoiceNotFound"
    );
  });

  it("recordVerifiedPayment reverts if invoice is missing", async function () {
    const { receipt, owner, payer } = await deployFixture();

    await expect(
      receipt.connect(owner).recordVerifiedPayment(ethers.id("missing"), payer.address, ethers.id("tx"))
    ).to.be.revertedWithCustomError(receipt, "InvoiceNotFound");
  });

  it("payInvoice reverts if invoice is expired", async function () {
    const { receipt, token, payer, invoiceId, amount, deadline } = await registerInvoice();

    await token.mint(payer.address, amount);
    await token.connect(payer).approve(await receipt.getAddress(), amount);

    await network.provider.send("evm_setNextBlockTimestamp", [Number(deadline + 1n)]);
    await network.provider.send("evm_mine");

    await expect(receipt.connect(payer).payInvoice(invoiceId)).to.be.revertedWithCustomError(
      receipt,
      "InvoiceExpired"
    );
  });

  it("recordVerifiedPayment reverts if invoice is expired", async function () {
    const { receipt, owner, payer, invoiceId, deadline } = await registerInvoice();

    await network.provider.send("evm_setNextBlockTimestamp", [Number(deadline + 1n)]);
    await network.provider.send("evm_mine");

    await expect(
      receipt.connect(owner).recordVerifiedPayment(invoiceId, payer.address, ethers.id("tx"))
    ).to.be.revertedWithCustomError(receipt, "InvoiceExpired");
  });

  it("payInvoice reverts without sufficient allowance", async function () {
    const { receipt, token, payer, invoiceId, amount } = await registerInvoice();

    await token.mint(payer.address, amount);

    await expect(receipt.connect(payer).payInvoice(invoiceId)).to.be.reverted;
  });

  it("isPaid returns true after payment", async function () {
    const { receipt, token, payer, invoiceId, amount } = await registerInvoice();

    expect(await receipt.isPaid(invoiceId)).to.equal(false);
    await token.mint(payer.address, amount);
    await token.connect(payer).approve(await receipt.getAddress(), amount);
    await receipt.connect(payer).payInvoice(invoiceId);
    expect(await receipt.isPaid(invoiceId)).to.equal(true);
  });
});
