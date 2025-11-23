// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title ParcelitoENS
 * @notice Simple ENS-style registry for Parcelito on World Chain
 * @dev Each subdomain is an NFT. Owner can set text records.
 *      e.g., "agoston.6256" → maps to wallet, stores claims in text records
 */
contract ParcelitoENS is ERC721 {
    // Base domain (e.g., "parcelitos.eth")
    string public baseDomain;

    // Admin address
    address public admin;

    // Subdomain label → token ID (keccak256 hash)
    // e.g., "agoston.6256" → tokenId

    // Token ID → subdomain label
    mapping(uint256 => string) public labels;

    // Token ID → text records (key → value)
    mapping(uint256 => mapping(string => string)) public texts;

    // Label → registered (to prevent duplicates)
    mapping(string => bool) public registered;

    // Total supply
    uint256 public totalSupply;

    event SubdomainRegistered(string indexed label, address indexed owner, uint256 tokenId);
    event TextChanged(uint256 indexed tokenId, string key, string value);

    error AlreadyRegistered();
    error NotOwner();
    error EmptyLabel();

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(string memory _baseDomain) ERC721("Parcelito Names", "PARCELITO") {
        baseDomain = _baseDomain;
        admin = msg.sender;
    }

    /**
     * @notice Register a subdomain (e.g., "agoston.6256")
     * @param label The subdomain label (World username)
     * @param owner The address that will own this subdomain
     */
    function register(string calldata label, address owner) external returns (uint256) {
        if (bytes(label).length == 0) revert EmptyLabel();
        if (registered[label]) revert AlreadyRegistered();

        uint256 tokenId = uint256(keccak256(bytes(label)));

        registered[label] = true;
        labels[tokenId] = label;
        totalSupply++;

        _safeMint(owner, tokenId);

        emit SubdomainRegistered(label, owner, tokenId);
        return tokenId;
    }

    /**
     * @notice Set a text record for your subdomain
     * @param tokenId The token ID of your subdomain
     * @param key The record key (e.g., "parcelito.claims")
     * @param value The record value (e.g., JSON claims data)
     */
    function setText(uint256 tokenId, string calldata key, string calldata value) external {
        if (ownerOf(tokenId) != msg.sender) revert NotOwner();

        texts[tokenId][key] = value;
        emit TextChanged(tokenId, key, value);
    }

    /**
     * @notice Get a text record
     * @param tokenId The token ID
     * @param key The record key
     */
    function text(uint256 tokenId, string calldata key) external view returns (string memory) {
        return texts[tokenId][key];
    }

    /**
     * @notice Get token ID from label
     * @param label The subdomain label
     */
    function getTokenId(string calldata label) external pure returns (uint256) {
        return uint256(keccak256(bytes(label)));
    }

    /**
     * @notice Get full domain name
     * @param tokenId The token ID
     */
    function fullName(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(labels[tokenId], ".", baseDomain));
    }

    /**
     * @notice Check if a label is available
     * @param label The subdomain label
     */
    function available(string calldata label) external view returns (bool) {
        return !registered[label];
    }

    /**
     * @notice Admin function to update base domain
     */
    function setBaseDomain(string calldata _baseDomain) external onlyAdmin {
        baseDomain = _baseDomain;
    }

    /**
     * @notice Transfer admin role
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }
}
