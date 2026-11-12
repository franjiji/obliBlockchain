// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title VestingPayroll
/// @notice Acuerdos de pago/vesting lineal en ERC-20. El pagador fondea el total al crear el
///         acuerdo y el beneficiario reclama solo lo devengado segun el tiempo transcurrido.
///         Opcionalmente hay un cliff: antes de esa fecha no se puede reclamar nada.
contract VestingPayroll is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ───────────────────────────── Tipos ─────────────────────────────

    enum Status {
        Active,
        Completed,
        Cancelled
    }

    /// @dev Empaquetado en 4 slots de storage (ver docs/ARQUITECTURA.md):
    ///      slot0: payer(20) + startTime(5) + endTime(5) + revocable(1) + status(1) = 32 bytes
    ///      slot1: beneficiary(20) + cancelledAt(5) + cliffTime(5)
    ///      slot2: token(20)
    ///      slot3: totalAmount(16) + claimedAmount(16) = 32 bytes
    struct Agreement {
        address payer;
        uint40 startTime;
        uint40 endTime;
        bool revocable;
        Status status;
        address beneficiary;
        uint40 cancelledAt; // 0 mientras no se cancele
        uint40 cliffTime; // en [startTime, endTime]; igual a startTime significa sin cliff
        IERC20 token;
        uint128 totalAmount;
        uint128 claimedAmount;
    }

    // ───────────────────────────── Storage ─────────────────────────────

    /// @dev Los ids arrancan en 1; el id 0 nunca existe.
    uint256 public agreementCount;
    mapping(uint256 id => Agreement) private _agreements;

    // ───────────────────────────── Eventos ─────────────────────────────

    event AgreementCreated(
        uint256 indexed id,
        address indexed payer,
        address indexed beneficiary,
        address token,
        uint128 totalAmount,
        uint40 startTime,
        uint40 cliffTime,
        uint40 endTime,
        bool revocable
    );
    event Claimed(uint256 indexed id, address indexed beneficiary, uint128 amount, uint128 totalClaimed);
    event AgreementCompleted(uint256 indexed id);
    event AgreementCancelled(uint256 indexed id, address indexed payer, uint128 vestedAtCancel, uint128 refunded);

    // ───────────────────────────── Errores ─────────────────────────────

    error InvalidBeneficiary();
    error InvalidToken();
    error InvalidAmount();
    error InvalidTimeRange();
    error InvalidCliff();
    error AgreementNotFound(uint256 id);
    error NotBeneficiary(uint256 id, address caller);
    error NotPayer(uint256 id, address caller);
    error NothingToClaim(uint256 id);
    error NotRevocable(uint256 id);
    error NotActive(uint256 id, Status status);
    error AlreadyEnded(uint256 id);
    error UnexpectedTransferAmount(uint256 expected, uint256 received);

    // ───────────────────────────── Escritura ─────────────────────────────

    /// @notice Crea un acuerdo y bloquea `totalAmount` del pagador (requiere approve previo).
    /// @param cliffTime Fecha antes de la cual no se devenga nada; debe estar en [startTime, endTime].
    ///        Pasar `startTime` para un acuerdo sin cliff.
    function createAgreement(
        address beneficiary,
        IERC20 token,
        uint128 totalAmount,
        uint40 startTime,
        uint40 cliffTime,
        uint40 endTime,
        bool revocable
    ) external nonReentrant returns (uint256 id) {
        // Checks
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (address(token) == address(0)) revert InvalidToken();
        if (totalAmount == 0) revert InvalidAmount();
        if (endTime <= startTime) revert InvalidTimeRange();
        if (cliffTime < startTime || cliffTime > endTime) revert InvalidCliff();

        // Effects
        id = ++agreementCount;
        _agreements[id] = Agreement({
            payer: msg.sender,
            startTime: startTime,
            endTime: endTime,
            revocable: revocable,
            status: Status.Active,
            beneficiary: beneficiary,
            cancelledAt: 0,
            cliffTime: cliffTime,
            token: token,
            totalAmount: totalAmount,
            claimedAmount: 0
        });

        emit AgreementCreated(
            id,
            msg.sender,
            beneficiary,
            address(token),
            totalAmount,
            startTime,
            cliffTime,
            endTime,
            revocable
        );

        // Interactions: se mide lo realmente recibido para rechazar tokens con fee-on-transfer,
        // que dejarian el acuerdo sub-fondeado.
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), totalAmount);
        uint256 received = token.balanceOf(address(this)) - balanceBefore;
        if (received != totalAmount) revert UnexpectedTransferAmount(totalAmount, received);
    }

    /// @notice El beneficiario retira todo lo devengado que aun no reclamo.
    function claim(uint256 id) external nonReentrant {
        Agreement storage a = _load(id);
        if (msg.sender != a.beneficiary) revert NotBeneficiary(id, msg.sender);

        uint128 amount = _claimable(a, block.timestamp);
        if (amount == 0) revert NothingToClaim(id);

        // Effects (antes de cualquier transferencia externa)
        uint128 newClaimed = a.claimedAmount + amount;
        a.claimedAmount = newClaimed;
        if (newClaimed == a.totalAmount && a.status == Status.Active) {
            a.status = Status.Completed;
            emit AgreementCompleted(id);
        }
        emit Claimed(id, msg.sender, amount, newClaimed);

        // Interaction
        a.token.safeTransfer(msg.sender, amount);
    }

    /// @notice El pagador cancela un acuerdo revocable. Lo devengado queda para el beneficiario
    ///         y lo no devengado vuelve al pagador.
    function cancel(uint256 id) external nonReentrant {
        Agreement storage a = _load(id);
        if (msg.sender != a.payer) revert NotPayer(id, msg.sender);
        if (!a.revocable) revert NotRevocable(id);
        if (a.status != Status.Active) revert NotActive(id, a.status);
        if (block.timestamp >= a.endTime) revert AlreadyEnded(id);

        uint128 vested = _vested(a, block.timestamp);
        uint128 refund = a.totalAmount - vested;

        // Effects: congela el devengo en este instante
        a.status = Status.Cancelled;
        a.cancelledAt = uint40(block.timestamp);
        emit AgreementCancelled(id, msg.sender, vested, refund);

        // Interaction
        if (refund > 0) a.token.safeTransfer(a.payer, refund);
    }

    // ───────────────────────────── Lectura ─────────────────────────────

    function getAgreement(uint256 id) external view returns (Agreement memory) {
        return _load(id);
    }

    /// @notice Devengado a `timestamp` (si el acuerdo fue cancelado, nunca supera lo devengado al cancelar).
    function vestedAmountAt(uint256 id, uint256 timestamp) external view returns (uint128) {
        return _vested(_load(id), timestamp);
    }

    function vestedAmount(uint256 id) external view returns (uint128) {
        return _vested(_load(id), block.timestamp);
    }

    function claimableAmount(uint256 id) external view returns (uint128) {
        return _claimable(_load(id), block.timestamp);
    }

    // ───────────────────────────── Internas ─────────────────────────────

    function _load(uint256 id) private view returns (Agreement storage a) {
        a = _agreements[id];
        if (a.payer == address(0)) revert AgreementNotFound(id);
    }

    /// @dev vested = 0 antes del cliff; desde el cliff, total * (t - start) / (end - start),
    ///      con t acotado a [start, end]. Al llegar al cliff se desbloquea lo devengado desde el inicio.
    ///      Se multiplica antes de dividir y el redondeo es hacia abajo: el contrato nunca
    ///      devenga de mas, y en t >= end devuelve exactamente `totalAmount`.
    ///      No hay overflow: uint128 * uint40 cabe en uint256.
    function _vested(Agreement storage a, uint256 timestamp) private view returns (uint128) {
        if (a.status == Status.Cancelled && timestamp > a.cancelledAt) timestamp = a.cancelledAt;

        uint256 start = a.startTime;
        uint256 end = a.endTime;
        if (timestamp <= start || timestamp < a.cliffTime) return 0;
        if (timestamp >= end) return a.totalAmount;

        return uint128((uint256(a.totalAmount) * (timestamp - start)) / (end - start));
    }

    function _claimable(Agreement storage a, uint256 timestamp) private view returns (uint128) {
        return _vested(a, timestamp) - a.claimedAmount;
    }
}
