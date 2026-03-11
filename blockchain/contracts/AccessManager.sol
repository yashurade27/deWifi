// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WiFiRegistry.sol";
import "./AirlinkAccessNFT.sol";
import "./PaymentEscrow.sol";

/**
 * @title AccessManager
 * @notice The orchestrator contract for the Airlink decentralized WiFi marketplace.
 *         Users interact with this contract to purchase WiFi access, which:
 *           1. Validates the spot via WiFiRegistry
 *           2. Mints an ERC-721 access pass via AirlinkAccessNFT
 *           3. Escrows ETH payment via PaymentEscrow
 *         Gateway devices call verifyAccess() to check if a user has valid access.
 * @dev Coordinates WiFiRegistry, AirlinkAccessNFT, and PaymentEscrow.
 */
contract AccessManager is Ownable, ReentrancyGuard {
    // ──────────────────────────────────────────────
    //  Linked Contracts
    // ──────────────────────────────────────────────
    WiFiRegistry      public registry;
    AirlinkAccessNFT  public accessNFT;
    PaymentEscrow     public escrow;

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────
    uint256 public constant PLATFORM_FEE_BPS   = 200;   // 2%
    uint256 public constant BPS_DENOMINATOR    = 10_000;
    uint256 public constant MAX_DURATION_HOURS = 24;

    // ──────────────────────────────────────────────
    //  Enums & Structs
    // ──────────────────────────────────────────────
    enum SessionStatus { Active, Completed, Cancelled, Disputed }

    struct Session {
        uint256 tokenId;
        uint256 spotId;
        address user;
        address spotOwner;
        uint256 totalPaid;
        uint256 ownerShare;
        uint256 platformFee;
        uint256 startTime;
        uint256 endTime;
        SessionStatus status;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────
    mapping(uint256 => Session) public sessions;     // tokenId → Session
    mapping(address => uint256[]) private userSessions;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event AccessPurchased(
        uint256 indexed tokenId,
        uint256 indexed spotId,
        address indexed user,
        uint256 totalPaid,
        uint256 startTime,
        uint256 endTime
    );
    event SessionCompleted(uint256 indexed tokenId, uint256 ownerEarnings);
    event SessionCancelled(uint256 indexed tokenId, uint256 refundPercent);
    event SessionDisputed(uint256 indexed tokenId, address indexed disputedBy);
    event DisputeResolved(uint256 indexed tokenId, uint256 refundPercent);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────
    constructor(
        address _registry,
        address _accessNFT,
        address _escrow
    ) Ownable(msg.sender) {
        require(_registry != address(0) && _accessNFT != address(0) && _escrow != address(0), "Zero address");
        registry  = WiFiRegistry(_registry);
        accessNFT = AirlinkAccessNFT(_accessNFT);
        escrow    = PaymentEscrow(_escrow);
    }

    // ══════════════════════════════════════════════
    //  PURCHASE ACCESS
    // ══════════════════════════════════════════════

    /**
     * @notice Purchase WiFi access by paying ETH. Mints an NFT pass and
     *         escrows the payment. This is the primary user entry point.
     * @param _spotId        ID of the WiFi spot to access
     * @param _durationHours Duration in hours (1-24)
     * @param _startTime     Unix timestamp for session start (0 = now)
     * @return tokenId       The minted NFT token ID (also the session ID)
     */
    function purchaseAccess(
        uint256 _spotId,
        uint256 _durationHours,
        uint256 _startTime
    ) external payable nonReentrant returns (uint256 tokenId) {
        require(_durationHours >= 1 && _durationHours <= MAX_DURATION_HOURS, "Invalid duration");
        require(registry.isSpotActive(_spotId), "Spot not active");
        require(registry.hasCapacity(_spotId), "Spot at capacity");

        address spotOwner = registry.getSpotOwner(_spotId);
        require(spotOwner != msg.sender, "Cannot buy own spot");

        uint256 pricePerHour = registry.getSpotPrice(_spotId);
        uint256 totalCost = pricePerHour * _durationHours;
        require(msg.value == totalCost, "Incorrect payment amount");

        uint256 fee = (totalCost * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 ownerShare = totalCost - fee;

        uint256 start = _startTime == 0 ? block.timestamp : _startTime;
        require(start >= block.timestamp, "Start time in the past");
        uint256 end = start + (_durationHours * 1 hours);

        // 1. Mint NFT access pass
        tokenId = accessNFT.mintAccess(msg.sender, _spotId, start, end, _durationHours);

        // 2. Escrow the ETH payment
        escrow.deposit{value: msg.value}(tokenId, msg.sender, spotOwner, fee);

        // 3. Update registry capacity
        registry.incrementUsers(_spotId);

        // 4. Store session record
        sessions[tokenId] = Session({
            tokenId: tokenId,
            spotId: _spotId,
            user: msg.sender,
            spotOwner: spotOwner,
            totalPaid: totalCost,
            ownerShare: ownerShare,
            platformFee: fee,
            startTime: start,
            endTime: end,
            status: SessionStatus.Active
        });

        userSessions[msg.sender].push(tokenId);

        emit AccessPurchased(tokenId, _spotId, msg.sender, totalCost, start, end);
    }

    // ══════════════════════════════════════════════
    //  GATEWAY VERIFICATION (free view calls)
    // ══════════════════════════════════════════════

    /**
     * @notice Verify that a user has valid WiFi access. Called by gateway devices.
     * @dev This is a view function — no gas cost. The gateway calls this
     *      with the user's tokenId and wallet address to decide whether to
     *      grant internet access.
     * @param _tokenId NFT token ID presented by the user
     * @param _user    Wallet address of the user
     * @return valid   True if the token is valid and owned by the user
     * @return spotId  The spot this token grants access to
     * @return expiresAt  When the access expires
     */
    function verifyAccess(
        uint256 _tokenId,
        address _user
    ) external view returns (bool valid, uint256 spotId, uint256 expiresAt) {
        Session storage session = sessions[_tokenId];
        if (session.status != SessionStatus.Active) return (false, 0, 0);

        bool nftValid = accessNFT.isAccessValidFor(_tokenId, _user);
        return (nftValid, session.spotId, session.endTime);
    }

    /**
     * @notice Convenience function for gateways that know their own spot ID.
     * @param _tokenId  NFT token ID
     * @param _user     User wallet address
     * @param _spotId   The spot ID the gateway is serving
     * @return valid    True if access is valid for this specific spot
     * @return expiresAt When the access expires
     */
    function verifyAccessForSpot(
        uint256 _tokenId,
        address _user,
        uint256 _spotId
    ) external view returns (bool valid, uint256 expiresAt) {
        Session storage session = sessions[_tokenId];
        if (session.status != SessionStatus.Active) return (false, 0);
        if (session.spotId != _spotId) return (false, 0);

        bool nftValid = accessNFT.isAccessValidFor(_tokenId, _user);
        if (!nftValid) return (false, 0);
        return (true, session.endTime);
    }

    // ══════════════════════════════════════════════
    //  SESSION LIFECYCLE
    // ══════════════════════════════════════════════

    /**
     * @notice Complete a session and release escrowed funds to the spot owner.
     * @dev Can be called by: the user, the spot owner, the platform admin,
     *      or anyone if the session has expired (trustless finalization).
     */
    function completeSession(uint256 _tokenId) external nonReentrant {
        Session storage session = sessions[_tokenId];
        require(session.status == SessionStatus.Active, "Session not active");
        require(
            msg.sender == session.user ||
            msg.sender == session.spotOwner ||
            msg.sender == owner() ||
            block.timestamp > session.endTime,    // anyone can finalize expired sessions
            "Not authorized or session not expired"
        );

        session.status = SessionStatus.Completed;

        // Release escrow → owner receives ETH, platform fee accumulated
        escrow.release(_tokenId);

        // Update registry
        registry.decrementUsers(session.spotId);
        registry.addEarnings(session.spotId, session.ownerShare);

        // Mark NFT as used
        accessNFT.revokeAccess(_tokenId);

        emit SessionCompleted(_tokenId, session.ownerShare);
    }

    /**
     * @notice Cancel a session. Refund amount depends on timing:
     *         - Before start: 100% refund
     *         - During session: proportional refund based on remaining time
     *         - After end: reverts (use completeSession instead)
     */
    function cancelSession(uint256 _tokenId) external nonReentrant {
        Session storage session = sessions[_tokenId];
        require(
            msg.sender == session.user || msg.sender == owner(),
            "Not authorized"
        );
        require(session.status == SessionStatus.Active, "Session not active");

        session.status = SessionStatus.Cancelled;

        uint256 refundPercent;
        if (block.timestamp < session.startTime) {
            refundPercent = 100;
        } else if (block.timestamp < session.endTime) {
            uint256 elapsed = block.timestamp - session.startTime;
            uint256 totalDuration = session.endTime - session.startTime;
            uint256 remaining = totalDuration - elapsed;
            refundPercent = (remaining * 100) / totalDuration;
        } else {
            revert("Session ended, use completeSession");
        }

        escrow.refund(_tokenId, refundPercent);
        registry.decrementUsers(session.spotId);
        accessNFT.revokeAccess(_tokenId);

        emit SessionCancelled(_tokenId, refundPercent);
    }

    /**
     * @notice User raises a dispute (e.g., WiFi didn't work as advertised).
     *         The platform resolves disputes off-chain and calls resolveDispute().
     */
    function disputeSession(uint256 _tokenId) external {
        Session storage session = sessions[_tokenId];
        require(msg.sender == session.user, "Only session user can dispute");
        require(session.status == SessionStatus.Active, "Session not active");

        session.status = SessionStatus.Disputed;

        emit SessionDisputed(_tokenId, msg.sender);
    }

    /**
     * @notice Platform admin resolves a dispute by setting a refund percentage.
     * @param _tokenId       The disputed session's token ID
     * @param _refundPercent 0-100 — percentage to refund the user
     */
    function resolveDispute(
        uint256 _tokenId,
        uint256 _refundPercent
    ) external onlyOwner nonReentrant {
        Session storage session = sessions[_tokenId];
        require(session.status == SessionStatus.Disputed, "Not disputed");
        require(_refundPercent <= 100, "Invalid percent");

        session.status = SessionStatus.Completed;

        escrow.refund(_tokenId, _refundPercent);
        registry.decrementUsers(session.spotId);
        accessNFT.revokeAccess(_tokenId);

        emit DisputeResolved(_tokenId, _refundPercent);
    }

    // ══════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════════

    /// @notice Preview the cost of booking a spot.
    function calculateCost(
        uint256 _spotId,
        uint256 _durationHours
    ) external view returns (uint256 total, uint256 ownerShare, uint256 fee) {
        uint256 price = registry.getSpotPrice(_spotId);
        total = price * _durationHours;
        fee = (total * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        ownerShare = total - fee;
    }

    function getSession(uint256 _tokenId) external view returns (Session memory) {
        return sessions[_tokenId];
    }

    function getUserSessions(address _user) external view returns (uint256[] memory) {
        return userSessions[_user];
    }
}
