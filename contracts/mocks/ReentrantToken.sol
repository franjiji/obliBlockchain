// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ITokenReceiverHook {
    function onTokenReceived() external;
}

/// @notice Mock para tests: al recibir tokens, avisa al receptor (como un hook ERC-777),
///         dandole la oportunidad de reentrar en el contrato que lo esta pagando.
contract ReentrantToken is ERC20 {
    /// @notice Motivo del ultimo revert dentro del hook (lo leen los tests).
    bytes public lastHookRevert;

    constructor() ERC20("Reentrant Token", "RNT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (from != address(0) && to.code.length > 0) {
            // El hook es "best effort", como en un token con callbacks: si falla, la transferencia
            // sigue, pero se guarda el motivo para que el test vea por que revirtio la reentrada.
            // solhint-disable-next-line avoid-low-level-calls
            (bool ok, bytes memory reason) = to.call(abi.encodeCall(ITokenReceiverHook.onTokenReceived, ()));
            if (!ok) lastHookRevert = reason;
        }
    }
}
