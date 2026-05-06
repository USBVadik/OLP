// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ReceiptEmitter
/// @notice Minimal invoice registry and payment proof emitter for OneLink Pay.
contract ReceiptEmitter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidMerchant();
    error InvalidToken();
    error InvalidAmount();
    error InvalidDeadline();
    error InvoiceAlreadyRegistered();
    error InvoiceNotFound();
    error InvoiceAlreadyPaid();
    error InvoiceExpired();

    event InvoiceRegistered(
        bytes32 indexed invoiceId,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 deadline
    );

    event InvoicePaid(
        bytes32 indexed invoiceId,
        address indexed merchant,
        address indexed payer,
        address token,
        uint256 amount,
        uint256 chainId,
        uint256 timestamp
    );

    struct Invoice {
        bytes32 invoiceId;
        address merchant;
        address token;
        uint256 amount;
        uint256 deadline;
        bool paid;
        address payer;
        uint256 paidAt;
        bytes32 paymentTxHash;
    }

    mapping(bytes32 => Invoice) private invoices;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerInvoice(
        bytes32 invoiceId,
        address merchant,
        address token,
        uint256 amount,
        uint256 deadline
    ) external onlyOwner {
        if (merchant == address(0)) revert InvalidMerchant();
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (invoices[invoiceId].merchant != address(0)) revert InvoiceAlreadyRegistered();

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            merchant: merchant,
            token: token,
            amount: amount,
            deadline: deadline,
            paid: false,
            payer: address(0),
            paidAt: 0,
            paymentTxHash: bytes32(0)
        });

        emit InvoiceRegistered(invoiceId, merchant, token, amount, deadline);
    }

    function payInvoice(bytes32 invoiceId) external nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.merchant == address(0)) revert InvoiceNotFound();
        if (invoice.paid) revert InvoiceAlreadyPaid();
        if (block.timestamp > invoice.deadline) revert InvoiceExpired();

        invoice.paid = true;
        invoice.payer = msg.sender;
        invoice.paidAt = block.timestamp;
        invoice.paymentTxHash = bytes32(0);

        IERC20(invoice.token).safeTransferFrom(msg.sender, invoice.merchant, invoice.amount);

        emit InvoicePaid(
            invoiceId,
            invoice.merchant,
            msg.sender,
            invoice.token,
            invoice.amount,
            block.chainid,
            block.timestamp
        );
    }

    function recordVerifiedPayment(
        bytes32 invoiceId,
        address payer,
        bytes32 paymentTxHash
    ) external onlyOwner nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.merchant == address(0)) revert InvoiceNotFound();
        if (invoice.paid) revert InvoiceAlreadyPaid();
        if (block.timestamp > invoice.deadline) revert InvoiceExpired();
        if (payer == address(0)) revert InvalidMerchant();

        invoice.paid = true;
        invoice.payer = payer;
        invoice.paidAt = block.timestamp;
        invoice.paymentTxHash = paymentTxHash;

        emit InvoicePaid(
            invoiceId,
            invoice.merchant,
            payer,
            invoice.token,
            invoice.amount,
            block.chainid,
            block.timestamp
        );
    }

    function isPaid(bytes32 invoiceId) external view returns (bool) {
        return invoices[invoiceId].paid;
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        Invoice memory invoice = invoices[invoiceId];
        if (invoice.merchant == address(0)) revert InvoiceNotFound();
        return invoice;
    }
}
