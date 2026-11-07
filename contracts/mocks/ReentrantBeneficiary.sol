// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VestingPayroll} from "../VestingPayroll.sol";

/// @notice Mock para tests: beneficiario malicioso que intenta reclamar de nuevo
///         desde el callback del token.
contract ReentrantBeneficiary {
    VestingPayroll public immutable vault;
    uint256 public targetId;
    uint256 public reentryAttempts;
    uint256 public reentrySuccesses;

    constructor(VestingPayroll _vault) {
        vault = _vault;
    }

    function attack(uint256 id) external {
        targetId = id;
        vault.claim(id);
    }

    function onTokenReceived() external {
        reentryAttempts++;
        try vault.claim(targetId) {
            reentrySuccesses++;
        } catch {}
    }
}
