// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AirlinkAccessNFT
 * @notice ERC-721 tokens representing time-limited WiFi access passes.
 *         Each token encodes: spot ID, start time, expiration, and duration.
 *         Gateway devices verify token validity via on-chain view calls.
 * @dev Only the AccessManager contract can mint and revoke tokens.
 *      Token metadata is generated on-chain as base64-encoded JSON so it
 *      renders in wallets and on OpenSea without external hosting.
 */
contract AirlinkAccessNFT is ERC721, Ownable {
    using Strings for uint256;
    using Strings for address;

    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────
    struct AccessPass {
        uint256 spotId;
        address originalBuyer;
        uint256 startTime;
        uint256 expiresAt;
        uint256 durationHours;
        bool    revoked;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────
    uint256 public nextTokenId;
    mapping(uint256 => AccessPass) public passes;

    /// @notice The AccessManager contract authorized to mint/revoke
    address public accessManager;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event AccessMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 indexed spotId,
        uint256 startTime,
        uint256 expiresAt
    );
    event AccessRevoked(uint256 indexed tokenId);
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
    constructor() ERC721("Airlink WiFi Pass", "AIRPASS") Ownable(msg.sender) {}

    // ══════════════════════════════════════════════
    //  ADMIN
    // ══════════════════════════════════════════════

    function setAccessManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Zero address");
        accessManager = _manager;
        emit AccessManagerSet(_manager);
    }

    // ══════════════════════════════════════════════
    //  MINT & REVOKE (AccessManager only)
    // ══════════════════════════════════════════════

    /**
     * @notice Mint a new WiFi access pass NFT.
     * @param _to            Recipient address
     * @param _spotId        WiFi spot ID from the registry
     * @param _startTime     Unix timestamp when access begins
     * @param _expiresAt     Unix timestamp when access expires
     * @param _durationHours Booked duration in hours
     * @return tokenId       The minted token ID
     */
    function mintAccess(
        address _to,
        uint256 _spotId,
        uint256 _startTime,
        uint256 _expiresAt,
        uint256 _durationHours
    ) external onlyManager returns (uint256 tokenId) {
        tokenId = nextTokenId++;

        passes[tokenId] = AccessPass({
            spotId: _spotId,
            originalBuyer: _to,
            startTime: _startTime,
            expiresAt: _expiresAt,
            durationHours: _durationHours,
            revoked: false
        });

        _mint(_to, tokenId);

        emit AccessMinted(tokenId, _to, _spotId, _startTime, _expiresAt);
    }

    /// @notice Revoke an access pass (e.g., after session completion or cancellation).
    function revokeAccess(uint256 _tokenId) external onlyManager {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        passes[_tokenId].revoked = true;
        emit AccessRevoked(_tokenId);
    }

    // ══════════════════════════════════════════════
    //  VERIFICATION (used by gateway & AccessManager)
    // ══════════════════════════════════════════════

    /**
     * @notice Check if a token represents valid, active access.
     * @return True if the token exists, is not revoked, and is within the time window.
     */
    function isAccessValid(uint256 _tokenId) external view returns (bool) {
        if (_ownerOf(_tokenId) == address(0)) return false;
        AccessPass storage pass = passes[_tokenId];
        if (pass.revoked) return false;
        if (block.timestamp < pass.startTime) return false;
        if (block.timestamp > pass.expiresAt) return false;
        return true;
    }

    /**
     * @notice Check if a specific user holds a valid access token.
     * @dev Combines ownership check with validity check — the primary
     *      function called by the gateway via AccessManager.
     */
    function isAccessValidFor(uint256 _tokenId, address _user) external view returns (bool) {
        if (_ownerOf(_tokenId) == address(0)) return false;
        if (ownerOf(_tokenId) != _user) return false;
        AccessPass storage pass = passes[_tokenId];
        if (pass.revoked) return false;
        if (block.timestamp < pass.startTime) return false;
        if (block.timestamp > pass.expiresAt) return false;
        return true;
    }

    function getAccessPass(uint256 _tokenId) external view returns (AccessPass memory) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return passes[_tokenId];
    }

    // ══════════════════════════════════════════════
    //  ON-CHAIN METADATA
    // ══════════════════════════════════════════════

    /**
     * @notice Returns fully on-chain JSON metadata (base64-encoded).
     *         Renders in MetaMask, OpenSea, and other NFT viewers.
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        AccessPass storage pass = passes[_tokenId];

        string memory status = pass.revoked
            ? "Revoked"
            : (block.timestamp > pass.expiresAt
                ? "Expired"
                : (block.timestamp < pass.startTime ? "Scheduled" : "Active"));

        // Build a minimal SVG image
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">',
            '<rect width="350" height="350" rx="20" fill="#0a0a1a"/>',
            '<text x="175" y="60" text-anchor="middle" fill="#66FF00" font-size="18" font-family="monospace">AIRLINK WiFi PASS</text>',
            '<text x="175" y="120" text-anchor="middle" fill="#fff" font-size="42" font-family="sans-serif">#', _tokenId.toString(), '</text>',
            '<text x="175" y="180" text-anchor="middle" fill="#888" font-size="14" font-family="monospace">Spot #', pass.spotId.toString(), '</text>',
            '<text x="175" y="220" text-anchor="middle" fill="#888" font-size="14" font-family="monospace">', pass.durationHours.toString(), ' hours</text>',
            '<text x="175" y="290" text-anchor="middle" fill="', _statusColor(status),'" font-size="20" font-family="monospace">', status, '</text>',
            '</svg>'
        ));

        string memory json = string(abi.encodePacked(
            '{"name":"Airlink WiFi Pass #', _tokenId.toString(),
            '","description":"Time-limited WiFi access pass on the Airlink decentralized network.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes":[',
                '{"trait_type":"Spot ID","value":', pass.spotId.toString(), '},',
                '{"trait_type":"Duration (hours)","value":', pass.durationHours.toString(), '},',
                '{"trait_type":"Start Time","display_type":"date","value":', pass.startTime.toString(), '},',
                '{"trait_type":"Expires At","display_type":"date","value":', pass.expiresAt.toString(), '},',
                '{"trait_type":"Status","value":"', status, '"}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _statusColor(string memory _status) internal pure returns (string memory) {
        if (keccak256(bytes(_status)) == keccak256("Active")) return "#66FF00";
        if (keccak256(bytes(_status)) == keccak256("Scheduled")) return "#0088FF";
        if (keccak256(bytes(_status)) == keccak256("Expired")) return "#FF6600";
        return "#FF0000"; // Revoked
    }
}
