// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AirlinkMarketplace
 * @notice Decentralized WiFi sharing marketplace — owners register hotspots,
 *         users book access by paying ETH, and earnings are automatically split.
 * @dev Designed for Ethereum / EVM-compatible chains. Hackathon-ready.
 */
contract AirlinkMarketplace {
    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────
    uint256 public constant PLATFORM_FEE_BPS = 200; // 2% (basis points)
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MIN_PRICE_WEI = 0.0001 ether;
    uint256 public constant MAX_DURATION_HOURS = 24;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────
    address public immutable platformOwner;

    uint256 public nextSpotId;
    uint256 public nextBookingId;
    uint256 public platformBalance;

    // ──────────────────────────────────────────────
    //  Enums
    // ──────────────────────────────────────────────
    enum SpotStatus { Active, Inactive, Suspended }
    enum BookingStatus { Pending, Active, Completed, Cancelled, Disputed }
    enum SpotTag { Home, Cafe, Office, Library, CoWorking }

    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────
    struct WifiSpot {
        uint256 id;
        address owner;
        string name;
        string locationHash;   // IPFS CID or geohash — keeps coordinates private
        string metadataURI;    // IPFS URI for description, images, amenities
        uint256 pricePerHourWei;
        uint256 speedMbps;
        uint8 maxUsers;
        uint8 currentUsers;
        SpotTag tag;
        SpotStatus status;
        bool isVerified;       // set by platform after ownership proof
        uint256 totalEarnings;
        uint256 totalBookings;
        uint256 registeredAt;
    }

    struct Booking {
        uint256 id;
        uint256 spotId;
        address user;
        address spotOwner;
        uint256 startTime;
        uint256 endTime;
        uint256 durationHours;
        uint256 totalPaid;      // full amount sent by user
        uint256 ownerEarnings;  // 98%
        uint256 platformFee;    // 2%
        BookingStatus status;
        bytes32 accessTokenHash; // keccak256(token) — stored on-chain, token stays off-chain
        bool ownerWithdrawn;
        uint256 createdAt;
    }

    struct OwnerProfile {
        uint256[] spotIds;
        uint256 totalEarnings;
        uint256 withdrawableBalance;
        bool exists;
    }

    // ──────────────────────────────────────────────
    //  Mappings
    // ──────────────────────────────────────────────
    mapping(uint256 => WifiSpot) public spots;
    mapping(uint256 => Booking) public bookings;
    mapping(address => OwnerProfile) private ownerProfiles;
    mapping(address => uint256[]) private userBookings;

    // Verification: owner address => spot id => verified
    mapping(uint256 => bool) public spotVerified;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event SpotRegistered(
        uint256 indexed spotId,
        address indexed owner,
        string name,
        uint256 pricePerHourWei,
        SpotTag tag,
        uint256 timestamp
    );

    event SpotUpdated(
        uint256 indexed spotId,
        uint256 newPrice,
        SpotStatus newStatus
    );

    event SpotVerified(
        uint256 indexed spotId,
        address indexed verifier,
        uint256 timestamp
    );

    event BookingCreated(
        uint256 indexed bookingId,
        uint256 indexed spotId,
        address indexed user,
        uint256 durationHours,
        uint256 totalPaid,
        uint256 startTime,
        uint256 endTime
    );

    event BookingActivated(
        uint256 indexed bookingId,
        bytes32 accessTokenHash,
        uint256 timestamp
    );

    event BookingCompleted(
        uint256 indexed bookingId,
        uint256 ownerEarnings,
        uint256 platformFee
    );

    event BookingCancelled(
        uint256 indexed bookingId,
        address cancelledBy,
        uint256 refundAmount
    );

    event BookingDisputed(
        uint256 indexed bookingId,
        address disputedBy,
        uint256 timestamp
    );

    event EarningsWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event PlatformWithdrawal(
        address indexed to,
        uint256 amount
    );

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────
    modifier onlyPlatform() {
        require(msg.sender == platformOwner, "Not platform owner");
        _;
    }

    modifier onlySpotOwner(uint256 _spotId) {
        require(spots[_spotId].owner == msg.sender, "Not spot owner");
        _;
    }

    modifier spotExists(uint256 _spotId) {
        require(_spotId < nextSpotId, "Spot does not exist");
        _;
    }

    modifier bookingExists(uint256 _bookingId) {
        require(_bookingId < nextBookingId, "Booking does not exist");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────
    constructor() {
        platformOwner = msg.sender;
    }

    // ══════════════════════════════════════════════
    //  SPOT MANAGEMENT
    // ══════════════════════════════════════════════

    /**
     * @notice Register a new WiFi hotspot on-chain.
     * @param _name         Human-readable spot name
     * @param _locationHash Geohash or IPFS CID for location privacy
     * @param _metadataURI  IPFS URI for rich metadata (description, images)
     * @param _pricePerHourWei Price per hour in wei
     * @param _speedMbps    Advertised speed
     * @param _maxUsers     Maximum concurrent users
     * @param _tag          Category tag (Home/Cafe/Office/Library/CoWorking)
     */
    function registerSpot(
        string calldata _name,
        string calldata _locationHash,
        string calldata _metadataURI,
        uint256 _pricePerHourWei,
        uint256 _speedMbps,
        uint8 _maxUsers,
        SpotTag _tag
    ) external returns (uint256 spotId) {
        require(bytes(_name).length > 0 && bytes(_name).length <= 100, "Invalid name length");
        require(_pricePerHourWei >= MIN_PRICE_WEI, "Price too low");
        require(_maxUsers > 0 && _maxUsers <= 50, "Invalid max users");

        spotId = nextSpotId++;

        spots[spotId] = WifiSpot({
            id: spotId,
            owner: msg.sender,
            name: _name,
            locationHash: _locationHash,
            metadataURI: _metadataURI,
            pricePerHourWei: _pricePerHourWei,
            speedMbps: _speedMbps,
            maxUsers: _maxUsers,
            currentUsers: 0,
            tag: _tag,
            status: SpotStatus.Active,
            isVerified: false,
            totalEarnings: 0,
            totalBookings: 0,
            registeredAt: block.timestamp
        });

        // Initialize owner profile
        if (!ownerProfiles[msg.sender].exists) {
            ownerProfiles[msg.sender].exists = true;
        }
        ownerProfiles[msg.sender].spotIds.push(spotId);

        emit SpotRegistered(spotId, msg.sender, _name, _pricePerHourWei, _tag, block.timestamp);
    }

    /**
     * @notice Update spot price and status.
     */
    function updateSpot(
        uint256 _spotId,
        uint256 _newPrice,
        SpotStatus _newStatus
    ) external onlySpotOwner(_spotId) spotExists(_spotId) {
        require(_newPrice >= MIN_PRICE_WEI, "Price too low");

        WifiSpot storage spot = spots[_spotId];
        spot.pricePerHourWei = _newPrice;
        spot.status = _newStatus;

        emit SpotUpdated(_spotId, _newPrice, _newStatus);
    }

    /**
     * @notice Platform verifies spot ownership after off-chain proof.
     * @dev Only callable by the platform owner address.
     *      Verification proof happens off-chain (photo, geolocation, router screenshot).
     *      The on-chain flag gives users confidence the spot is legitimate.
     */
    function verifySpot(uint256 _spotId) external onlyPlatform spotExists(_spotId) {
        spots[_spotId].isVerified = true;
        spotVerified[_spotId] = true;

        emit SpotVerified(_spotId, msg.sender, block.timestamp);
    }

    // ══════════════════════════════════════════════
    //  BOOKING & PAYMENT
    // ══════════════════════════════════════════════

    /**
     * @notice Book WiFi access. User sends ETH equal to (pricePerHour × duration).
     *         Funds are held in the contract until session completes.
     * @param _spotId        Spot to book
     * @param _durationHours Number of hours (1-24)
     * @param _startTime     Unix timestamp for session start (0 = now)
     */
    function bookAccess(
        uint256 _spotId,
        uint256 _durationHours,
        uint256 _startTime
    ) external payable spotExists(_spotId) returns (uint256 bookingId) {
        WifiSpot storage spot = spots[_spotId];

        require(spot.status == SpotStatus.Active, "Spot not active");
        require(spot.owner != msg.sender, "Cannot book own spot");
        require(_durationHours >= 1 && _durationHours <= MAX_DURATION_HOURS, "Invalid duration");
        require(spot.currentUsers < spot.maxUsers, "Spot at capacity");

        uint256 totalCost = spot.pricePerHourWei * _durationHours;
        require(msg.value == totalCost, "Incorrect payment amount");

        uint256 fee = (totalCost * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 ownerShare = totalCost - fee;

        uint256 start = _startTime == 0 ? block.timestamp : _startTime;
        require(start >= block.timestamp, "Start time in the past");
        uint256 end = start + (_durationHours * 1 hours);

        bookingId = nextBookingId++;

        bookings[bookingId] = Booking({
            id: bookingId,
            spotId: _spotId,
            user: msg.sender,
            spotOwner: spot.owner,
            startTime: start,
            endTime: end,
            durationHours: _durationHours,
            totalPaid: totalCost,
            ownerEarnings: ownerShare,
            platformFee: fee,
            status: BookingStatus.Pending,
            accessTokenHash: bytes32(0),
            ownerWithdrawn: false,
            createdAt: block.timestamp
        });

        spot.currentUsers++;
        spot.totalBookings++;
        userBookings[msg.sender].push(bookingId);

        emit BookingCreated(
            bookingId,
            _spotId,
            msg.sender,
            _durationHours,
            totalCost,
            start,
            end
        );
    }

    /**
     * @notice Activate a booking by setting the access token hash.
     * @dev Called by the backend/platform after payment is confirmed.
     *      The actual access token is generated off-chain; only its hash is stored.
     * @param _bookingId       Booking to activate
     * @param _accessTokenHash keccak256(abi.encodePacked(accessToken))
     */
    function activateBooking(
        uint256 _bookingId,
        bytes32 _accessTokenHash
    ) external bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.user || msg.sender == platformOwner,
            "Not authorized"
        );
        require(booking.status == BookingStatus.Pending, "Not pending");
        require(_accessTokenHash != bytes32(0), "Invalid token hash");

        booking.status = BookingStatus.Active;
        booking.accessTokenHash = _accessTokenHash;

        emit BookingActivated(_bookingId, _accessTokenHash, block.timestamp);
    }

    /**
     * @notice Verify an access token against a booking (view function — free call).
     * @param _bookingId   Booking ID
     * @param _accessToken The plaintext access token to verify
     * @return valid       True if token matches and booking is active + within time window
     */
    function verifyAccess(
        uint256 _bookingId,
        string calldata _accessToken
    ) external view bookingExists(_bookingId) returns (bool valid) {
        Booking storage booking = bookings[_bookingId];

        if (booking.status != BookingStatus.Active) return false;
        if (block.timestamp < booking.startTime) return false;
        if (block.timestamp > booking.endTime) return false;

        bytes32 tokenHash = keccak256(abi.encodePacked(_accessToken));
        return tokenHash == booking.accessTokenHash;
    }

    /**
     * @notice Complete a booking and release funds to owner.
     * @dev Can be called by the user, spot owner, or platform.
     */
    function completeBooking(
        uint256 _bookingId
    ) external bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(
            booking.status == BookingStatus.Active ||
            booking.status == BookingStatus.Pending,
            "Cannot complete"
        );
        require(
            msg.sender == booking.user ||
            msg.sender == booking.spotOwner ||
            msg.sender == platformOwner,
            "Not authorized"
        );

        booking.status = BookingStatus.Completed;

        // Credit owner's withdrawable balance
        ownerProfiles[booking.spotOwner].withdrawableBalance += booking.ownerEarnings;
        ownerProfiles[booking.spotOwner].totalEarnings += booking.ownerEarnings;

        // Credit platform fee
        platformBalance += booking.platformFee;

        // Update spot stats
        WifiSpot storage spot = spots[booking.spotId];
        spot.totalEarnings += booking.ownerEarnings;
        if (spot.currentUsers > 0) {
            spot.currentUsers--;
        }

        emit BookingCompleted(_bookingId, booking.ownerEarnings, booking.platformFee);
    }

    /**
     * @notice Cancel a booking. Full refund if session hasn't started.
     *         50% refund if session is in progress.
     */
    function cancelBooking(
        uint256 _bookingId
    ) external bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.user || msg.sender == platformOwner,
            "Not authorized"
        );
        require(
            booking.status == BookingStatus.Pending ||
            booking.status == BookingStatus.Active,
            "Cannot cancel"
        );

        uint256 refundAmount;

        if (block.timestamp < booking.startTime) {
            // Full refund — session hasn't started
            refundAmount = booking.totalPaid;
        } else if (block.timestamp < booking.endTime) {
            // Partial refund — 50% for mid-session cancellation
            refundAmount = booking.totalPaid / 2;
            uint256 remaining = booking.totalPaid - refundAmount;
            uint256 fee = (remaining * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            ownerProfiles[booking.spotOwner].withdrawableBalance += (remaining - fee);
            platformBalance += fee;
        } else {
            // Session already ended — no refund, complete instead
            revert("Session ended, use completeBooking");
        }

        booking.status = BookingStatus.Cancelled;

        WifiSpot storage spot = spots[booking.spotId];
        if (spot.currentUsers > 0) {
            spot.currentUsers--;
        }

        if (refundAmount > 0) {
            (bool sent, ) = payable(booking.user).call{value: refundAmount}("");
            require(sent, "Refund failed");
        }

        emit BookingCancelled(_bookingId, msg.sender, refundAmount);
    }

    /**
     * @notice Raise a dispute on a booking (e.g., WiFi didn't work).
     * @dev Platform resolves disputes off-chain and calls resolveDispute().
     */
    function disputeBooking(
        uint256 _bookingId
    ) external bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.user, "Only user can dispute");
        require(booking.status == BookingStatus.Active, "Not active");

        booking.status = BookingStatus.Disputed;

        emit BookingDisputed(_bookingId, msg.sender, block.timestamp);
    }

    /**
     * @notice Platform resolves a dispute by deciding refund percentage (0-100).
     * @param _bookingId       The disputed booking
     * @param _refundPercent   0-100, how much to refund the user
     */
    function resolveDispute(
        uint256 _bookingId,
        uint256 _refundPercent
    ) external onlyPlatform bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(booking.status == BookingStatus.Disputed, "Not disputed");
        require(_refundPercent <= 100, "Invalid percent");

        uint256 refundAmount = (booking.totalPaid * _refundPercent) / 100;
        uint256 remaining = booking.totalPaid - refundAmount;

        if (remaining > 0) {
            uint256 fee = (remaining * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            ownerProfiles[booking.spotOwner].withdrawableBalance += (remaining - fee);
            platformBalance += fee;
        }

        booking.status = BookingStatus.Completed;

        WifiSpot storage spot = spots[booking.spotId];
        if (spot.currentUsers > 0) {
            spot.currentUsers--;
        }

        if (refundAmount > 0) {
            (bool sent, ) = payable(booking.user).call{value: refundAmount}("");
            require(sent, "Refund failed");
        }

        emit BookingCompleted(_bookingId, booking.ownerEarnings, booking.platformFee);
    }

    // ══════════════════════════════════════════════
    //  WITHDRAWALS
    // ══════════════════════════════════════════════

    /**
     * @notice Owner withdraws accumulated earnings.
     */
    function withdrawEarnings() external {
        OwnerProfile storage profile = ownerProfiles[msg.sender];
        require(profile.exists, "Not an owner");
        uint256 amount = profile.withdrawableBalance;
        require(amount > 0, "No earnings to withdraw");

        profile.withdrawableBalance = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit EarningsWithdrawn(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Platform owner withdraws accumulated platform fees.
     */
    function withdrawPlatformFees() external onlyPlatform {
        uint256 amount = platformBalance;
        require(amount > 0, "No fees to withdraw");

        platformBalance = 0;

        (bool sent, ) = payable(platformOwner).call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit PlatformWithdrawal(platformOwner, amount);
    }

    // ══════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════════

    function getSpot(uint256 _spotId) external view spotExists(_spotId) returns (WifiSpot memory) {
        return spots[_spotId];
    }

    function getBooking(uint256 _bookingId) external view bookingExists(_bookingId) returns (Booking memory) {
        return bookings[_bookingId];
    }

    function getOwnerSpots(address _owner) external view returns (uint256[] memory) {
        return ownerProfiles[_owner].spotIds;
    }

    function getOwnerEarnings(address _owner) external view returns (
        uint256 totalEarnings,
        uint256 withdrawableBalance
    ) {
        OwnerProfile storage profile = ownerProfiles[_owner];
        return (profile.totalEarnings, profile.withdrawableBalance);
    }

    function getUserBookings(address _user) external view returns (uint256[] memory) {
        return userBookings[_user];
    }

    function calculateBookingCost(
        uint256 _spotId,
        uint256 _durationHours
    ) external view spotExists(_spotId) returns (
        uint256 total,
        uint256 ownerShare,
        uint256 fee
    ) {
        total = spots[_spotId].pricePerHourWei * _durationHours;
        fee = (total * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        ownerShare = total - fee;
    }

    function getActiveSpotCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < nextSpotId; i++) {
            if (spots[i].status == SpotStatus.Active) count++;
        }
    }
}
