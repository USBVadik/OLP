// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SpendPolicy
/// @notice On-chain enforcement of a payer-signed PaymentMandate: a merchant (or relayer)
///         can pull USDC from the payer, but only within the scope the payer signed —
///         per-charge cap, rolling daily cap, lifetime cap, expiry, single recipient.
///         Anything outside the mandate reverts. The payer can revoke at any time.
/// @dev    The PaymentMandate EIP-712 type is byte-compatible with the OneLink Pay frontend
///         (src/lib/mandates). The mandate id equals the EIP-712 digest.
contract SpendPolicy is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error BadSignature();
    error WrongChain();
    error InvalidAmount();
    error MandateExpired();
    error MandateIsRevoked();
    error PerChargeExceeded();
    error DailyCapExceeded();
    error TotalCapExceeded();
    error NotPayer();

    struct PaymentMandate {
        address payer;
        address merchant;
        address token;
        uint256 chainId;
        uint256 maxPerCharge;
        uint256 maxPerDay;
        uint256 totalCap;
        uint256 expiry;
        bytes32 nonce;
    }

    struct Permit {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct MandateState {
        uint256 spentTotal;
        uint256 spentToday;
        uint256 dayStart;
        bool revoked;
    }

    bytes32 public constant MANDATE_TYPEHASH =
        keccak256(
            "PaymentMandate(address payer,address merchant,address token,uint256 chainId,uint256 maxPerCharge,uint256 maxPerDay,uint256 totalCap,uint256 expiry,bytes32 nonce)"
        );

    mapping(bytes32 => MandateState) private _state;

    event MandateCharged(
        bytes32 indexed mandateId,
        address indexed payer,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 spentTotal,
        uint256 timestamp
    );

    event MandateRevoked(bytes32 indexed mandateId, address indexed payer);

    constructor() EIP712("OneLink Pay", "1") {}

    /// @notice Charge `amount` against a signed mandate using an existing allowance.
    function charge(
        PaymentMandate calldata mandate,
        bytes calldata signature,
        uint256 amount
    ) external nonReentrant returns (bytes32 mandateId) {
        return _charge(mandate, signature, amount);
    }

    /// @notice Charge against a signed mandate, first setting the allowance via EIP-2612 permit
    ///         (gasless sign-once for the payer; the merchant/relayer submits this call).
    function chargeWithPermit(
        PaymentMandate calldata mandate,
        bytes calldata signature,
        uint256 amount,
        Permit calldata permit
    ) external nonReentrant returns (bytes32 mandateId) {
        IERC20Permit(mandate.token).permit(
            mandate.payer,
            address(this),
            permit.value,
            permit.deadline,
            permit.v,
            permit.r,
            permit.s
        );
        return _charge(mandate, signature, amount);
    }

    /// @notice Revoke a mandate. Only the payer can revoke their own mandate.
    function revoke(PaymentMandate calldata mandate) external {
        if (msg.sender != mandate.payer) revert NotPayer();
        bytes32 mandateId = hashMandate(mandate);
        _state[mandateId].revoked = true;
        emit MandateRevoked(mandateId, mandate.payer);
    }

    /// @notice The EIP-712 digest of a mandate — its unique id.
    function hashMandate(PaymentMandate calldata mandate) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                MANDATE_TYPEHASH,
                mandate.payer,
                mandate.merchant,
                mandate.token,
                mandate.chainId,
                mandate.maxPerCharge,
                mandate.maxPerDay,
                mandate.totalCap,
                mandate.expiry,
                mandate.nonce
            )
        );
        return _hashTypedDataV4(structHash);
    }

    function getMandateState(bytes32 mandateId) external view returns (MandateState memory) {
        return _state[mandateId];
    }

    /// @notice Read how much more can be charged right now under this mandate.
    function remaining(PaymentMandate calldata mandate)
        external
        view
        returns (uint256 perCharge, uint256 today, uint256 total)
    {
        MandateState storage s = _state[hashMandate(mandate)];
        if (s.revoked || block.timestamp > mandate.expiry) return (0, 0, 0);

        uint256 spentTodayEffective = block.timestamp >= s.dayStart + 1 days ? 0 : s.spentToday;
        uint256 dailyLeft = mandate.maxPerDay == 0
            ? type(uint256).max
            : (mandate.maxPerDay > spentTodayEffective ? mandate.maxPerDay - spentTodayEffective : 0);
        uint256 totalLeft = mandate.totalCap > s.spentTotal ? mandate.totalCap - s.spentTotal : 0;

        perCharge = mandate.maxPerCharge;
        today = dailyLeft;
        total = totalLeft;
    }

    function _charge(
        PaymentMandate calldata mandate,
        bytes calldata signature,
        uint256 amount
    ) internal returns (bytes32 mandateId) {
        if (mandate.chainId != block.chainid) revert WrongChain();
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp > mandate.expiry) revert MandateExpired();

        mandateId = hashMandate(mandate);
        address signer = ECDSA.recover(mandateId, signature);
        if (signer != mandate.payer) revert BadSignature();

        MandateState storage s = _state[mandateId];
        if (s.revoked) revert MandateIsRevoked();
        if (amount > mandate.maxPerCharge) revert PerChargeExceeded();

        if (mandate.maxPerDay > 0) {
            if (block.timestamp >= s.dayStart + 1 days) {
                s.dayStart = block.timestamp;
                s.spentToday = 0;
            }
            if (s.spentToday + amount > mandate.maxPerDay) revert DailyCapExceeded();
            s.spentToday += amount;
        }

        if (s.spentTotal + amount > mandate.totalCap) revert TotalCapExceeded();
        s.spentTotal += amount;

        IERC20(mandate.token).safeTransferFrom(mandate.payer, mandate.merchant, amount);

        emit MandateCharged(
            mandateId,
            mandate.payer,
            mandate.merchant,
            mandate.token,
            amount,
            s.spentTotal,
            block.timestamp
        );
    }
}
