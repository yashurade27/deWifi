// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WiFiRegistry
 * @notice On-chain registry for WiFi hotspots. Owners register their hotspots
 *         with metadata, pricing, and capacity. The platform admin can verify spots.
 * @dev The AccessManager contract is authorized to update user counts and earnings.
 */
contract WiFiRegistry is Ownable {
    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────
    uint256 public constant MIN_PRICE_WEI = 0.0001 ether;

    // ──────────────────────────────────────────────
    //  Enums
    // ──────────────────────────────────────────────
    enum SpotStatus { Active, Inactive, Suspended }
    enum SpotTag { Home, Cafe, Office, Library, CoWorking }

    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────
    struct WifiSpot {
        uint256 id;
        address owner;
        string  name;
        string  locationHash;      // geohash or IPFS CID — keeps coordinates private
        string  metadataURI;       // IPFS URI for description, images, amenities
        uint256 pricePerHourWei;
        uint256 speedMbps;
        uint8   maxUsers;
        uint8   currentUsers;
        SpotTag tag;
        SpotStatus status;
        bool    isVerified;
        uint256 totalEarnings;
        uint256 totalBookings;
        uint256 registeredAt;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────
    uint256 public nextSpotId;
    mapping(uint256 => WifiSpot) public spots;
    mapping(address => uint256[]) private ownerSpots;

    /// @notice The AccessManager contract authorized to mutate session-related state
    address public accessManager;

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
    event SpotUpdated(uint256 indexed spotId, uint256 newPrice, SpotStatus newStatus);
    event SpotVerified(uint256 indexed spotId, uint256 timestamp);
    event AccessManagerSet(address indexed manager);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────
    modifier onlySpotOwner(uint256 _spotId) {
        require(spots[_spotId].owner == msg.sender, "Not spot owner");
        _;
    }

    modifier spotExists(uint256 _spotId) {
        require(_spotId < nextSpotId, "Spot does not exist");
        _;
    }

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

    /// @notice Set the AccessManager contract address (one-time or migration)
    function setAccessManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Zero address");
        accessManager = _manager;
        emit AccessManagerSet(_manager);
    }

    // ══════════════════════════════════════════════
    //  SPOT MANAGEMENT
    // ══════════════════════════════════════════════

    /**
     * @notice Register a new WiFi hotspot.
     * @param _name            Human-readable name (1-100 chars)
     * @param _locationHash    Geohash or IPFS CID for location privacy
     * @param _metadataURI     IPFS URI for rich metadata
     * @param _pricePerHourWei Price per hour in wei
     * @param _speedMbps       Advertised speed in Mbps
     * @param _maxUsers        Maximum concurrent users (1-50)
     * @param _tag             Category tag
     */
    function registerSpot(
        string calldata _name,
        string calldata _locationHash,
        string calldata _metadataURI,
        uint256 _pricePerHourWei,
        uint256 _speedMbps,
        uint8   _maxUsers,
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

        ownerSpots[msg.sender].push(spotId);

        emit SpotRegistered(spotId, msg.sender, _name, _pricePerHourWei, _tag, block.timestamp);
    }

    /// @notice Spot owner updates price and status.
    function updateSpot(
        uint256 _spotId,
        uint256 _newPrice,
        SpotStatus _newStatus
    ) external onlySpotOwner(_spotId) spotExists(_spotId) {
        require(_newPrice >= MIN_PRICE_WEI, "Price too low");
        spots[_spotId].pricePerHourWei = _newPrice;
        spots[_spotId].status = _newStatus;
        emit SpotUpdated(_spotId, _newPrice, _newStatus);
    }

    /// @notice Platform admin verifies a spot after off-chain proof.
    function verifySpot(uint256 _spotId) external onlyOwner spotExists(_spotId) {
        spots[_spotId].isVerified = true;
        emit SpotVerified(_spotId, block.timestamp);
    }

    // ══════════════════════════════════════════════
    //  MANAGER-ONLY MUTATIONS (called by AccessManager)
    // ══════════════════════════════════════════════

    function incrementUsers(uint256 _spotId) external onlyManager spotExists(_spotId) {
        WifiSpot storage spot = spots[_spotId];
        require(spot.currentUsers < spot.maxUsers, "At capacity");
        spot.currentUsers++;
        spot.totalBookings++;
    }

    function decrementUsers(uint256 _spotId) external onlyManager spotExists(_spotId) {
        WifiSpot storage spot = spots[_spotId];
        if (spot.currentUsers > 0) spot.currentUsers--;
    }

    function addEarnings(uint256 _spotId, uint256 _amount) external onlyManager spotExists(_spotId) {
        spots[_spotId].totalEarnings += _amount;
    }

    // ══════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ══════════════════════════════════════════════

    function getSpot(uint256 _spotId) external view spotExists(_spotId) returns (WifiSpot memory) {
        return spots[_spotId];
    }

    function getOwnerSpots(address _owner) external view returns (uint256[] memory) {
        return ownerSpots[_owner];
    }

    function isSpotActive(uint256 _spotId) external view returns (bool) {
        if (_spotId >= nextSpotId) return false;
        return spots[_spotId].status == SpotStatus.Active;
    }

    function getSpotOwner(uint256 _spotId) external view spotExists(_spotId) returns (address) {
        return spots[_spotId].owner;
    }

    function getSpotPrice(uint256 _spotId) external view spotExists(_spotId) returns (uint256) {
        return spots[_spotId].pricePerHourWei;
    }

    function hasCapacity(uint256 _spotId) external view spotExists(_spotId) returns (bool) {
        WifiSpot storage spot = spots[_spotId];
        return spot.currentUsers < spot.maxUsers;
    }
}
