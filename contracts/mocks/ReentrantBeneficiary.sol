// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VestingPayroll} from "../VestingPayroll.sol";

/// @notice Mock para tests: beneficiario malicioso que, desde el callback del token,
///         intenta reentrar en el contrato reclamando otra vez (el mismo acuerdo u otro).
contract ReentrantBeneficiary {
    VestingPayroll public immutable vault;
    uint256 public reentryId;

    constructor(VestingPayroll _vault) {
        vault = _vault;
    }

    /// @param id acuerdo que reclama normalmente
    /// @param _reentryId acuerdo que intenta reclamar al reentrar
    function attack(uint256 id, uint256 _reentryId) external {
        reentryId = _reentryId;
        vault.claim(id);
    }

    /// @dev Si la reentrada revierte, el revert sube al token, que guarda el motivo.
    function onTokenReceived() external {
        vault.claim(reentryId);
    }
}
