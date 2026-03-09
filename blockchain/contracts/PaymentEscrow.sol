// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentEscrow
 * @notice Holds ETH payments during active WiFi sessions. Funds are released
 *         to the spot owner on completion, or refunded (fully/partially) on
 *         cancellation or dispute. Platform fees are accumulated and withdrawn
 *         separately by the platform admin.
 * @dev Only the AccessManager contract can deposit, release, or trigger refunds.
 *      Uses ReentrancyGuard on all external-call paths.
 */
contract PaymentEscrow is Ownable, ReentrancyGuard {
    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────
    struct Deposit {
        address payer;
        address recipient;       // spot owner
        uint256 ownerShare;      // amount destined for owner
        uint256 platformFee;     // amount destined for platform
        uint256 totalDeposited;  // ownerShare + platformFee
        bool    released;
        bool    refunded;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────
    mapping(uint256 => Deposit) public deposits;  // tokenId → Deposit
    uint256 public platformBalance;

    /// @notice The AccessManager contract authorized to operate
    address public accessManager;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event Deposited(uint256 indexed tokenId, address indexed payer, uint256 amount);
    event Released(uint256 indexed tokenId, address indexed recipient, uint256 ownerAmount);
    event Refunded(uint256 indexed tokenId, address indexed payer, uint256 refundAmount);
    event PlatformWithdrawal(address indexed to, uint256 amount);
    event AccessManagerSet(address indexed manager);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────
    modifier onlyManager() {
        require(msg.sender == accessManager, "Only access manager");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ══════════════════════════════════════════════
    //  ADMIN
    // ══════════════════════════════════════════════

    function setAccessManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Zero address");
        accessManager = _manager;
        emit AccessManagerSet(_manager);
    }

    // ══════════════════════════════════════════════
    //  DEPOSIT / RELEASE / REFUND (AccessManager only)
    // ══════════════════════════════════════════════

    /**
     * @notice Accept an ETH deposit for a session. Called by AccessManager
     *         during purchaseAccess().
     * @param _tokenId     NFT token ID (session identifier)
     * @param _payer       User who paid
     * @param _recipient   Spot owner who will receive funds
     * @param _platformFee Platform fee portion of msg.value
     */
    function deposit(
        uint256 _tokenId,
        address _payer,
        address _recipient,
        uint256 _platformFee
    ) external payable onlyManager {
        require(msg.value > 0, "No ETH sent");
        require(deposits[_tokenId].totalDeposited == 0, "Deposit exists");
        require(_platformFee < msg.value, "Fee exceeds deposit");

        uint256 ownerShare = msg.value - _platformFee;

        deposits[_tokenId] = Deposit({
            payer: _payer,
            recipient: _recipient,
            ownerShare: ownerShare,
            platformFee: _platformFee,
            totalDeposited: msg.value,
            released: false,
            refunded: false
        });

        emit Deposited(_tokenId, _payer, msg.value);
    }

    /**
     * @notice Release escrowed funds to the spot owner and credit platform fees.
     *         Called on normal session completion.
     */
    function release(uint256 _tokenId) external onlyManager nonReentrant {
        Deposit storage d = deposits[_tokenId];
        require(d.totalDeposited > 0, "No deposit");
        require(!d.released && !d.refunded, "Already settled");

        d.released = true;
        platformBalance += d.platformFee;

        (bool sent, ) = payable(d.recipient).call{value: d.ownerShare}("");
        require(sent, "Transfer to owner failed");

        emit Released(_tokenId, d.recipient, d.ownerShare);
    }

    /**
     * @notice Refund the payer (fully or partially) and distribute the remainder.
     * @param _tokenId       Session NFT token ID
     * @param _refundPercent 0-100 — percentage of totalDeposited to refund
     */
    function refund(
        uint256 _tokenId,
        uint256 _refundPercent
    ) external onlyManager nonReentrant {
        Deposit storage d = deposits[_tokenId];
        require(d.totalDeposited > 0, "No deposit");
        require(!d.released && !d.refunded, "Already settled");
        require(_refundPercent <= 100, "Invalid percent");

        d.refunded = true;

        uint256 refundAmount = (d.totalDeposited * _refundPercent) / 100;
        uint256 remaining = d.totalDeposited - refundAmount;

        // Distribute the non-refunded portion between owner and platform
        if (remaining > 0) {
            // Maintain original fee ratio on the remaining amount
            uint256 fee = (remaining * d.platformFee) / d.totalDeposited;
            uint256 ownerAmount = remaining - fee;
            platformBalance += fee;

            if (ownerAmount > 0) {
                (bool sentOwner, ) = payable(d.recipient).call{value: ownerAmount}("");
                require(sentOwner, "Transfer to owner failed");
            }
        }

        if (refundAmount > 0) {
            (bool sentUser, ) = payable(d.payer).call{value: refundAmount}("");
            require(sentUser, "Refund transfer failed");
        }

        emit Refunded(_tokenId, d.payer, refundAmount);
    }

    // ══════════════════════════════════════════════
    //  PLATFORM WITHDRAWAL
    // ══════════════════════════════════════════════

    /// @notice Platform admin withdraws accumulated fees.
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformBalance;
        require(amount > 0, "No fees to withdraw");
        platformBalance = 0;

        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit PlatformWithdrawal(owner(), amount);
    }

    // ══════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════════

    function getDeposit(uint256 _tokenId) external view returns (Deposit memory) {
        return deposits[_tokenId];
    }
}
