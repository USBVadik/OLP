// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @notice 6-decimal, EIP-2612 permit-enabled mock USDC for SpendPolicy tests.
contract MockUSDCPermit is ERC20, ERC20Permit {
    constructor() ERC20("Mock USD Coin", "mUSDC") ERC20Permit("Mock USD Coin") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
