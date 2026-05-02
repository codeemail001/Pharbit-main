// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Pharbit is ERC1155, ERC1155Holder, AccessControl, EIP712, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPANY_ROLE = keccak256("COMPANY_ROLE");

    bytes32 private constant REDEEM_TYPEHASH = keccak256("Redeem(uint256 txId,address user,uint256 nonce)");

    // =========================
    // ERRORS
    // =========================
    error InvalidBatch();
    error InvalidAddress();
    error InvalidAmount();
    error Unauthorized();
    error InactiveBatch();
    error InactiveTransaction();
    error BadCourierID();
    error InvalidSignature();

    // =========================
    // STRUCTS
    // =========================
    struct Batch {
        address company;        // Slot 1: 160 bits
        bool active;            // Slot 1: 8 bits (Packed)
        uint128 totalSupply;    // Slot 2: 128 bits
        uint128 pricePerToken;  // Slot 2: 128 bits (Packed)
        bytes32 metadataHash;   // Slot 3: 256 bits
    }

    struct PendingTx {
        address from;           // Slot 1: 160 bits
        bool active;            // Slot 1: 8 bits (Packed)
        address to;             // Slot 2: 160 bits
        uint96 amount;          // Slot 2: 96 bits (Packed)
        uint128 pricePerToken;  // Slot 3: 128 bits
        uint128 batchId;        // Slot 3: 128 bits (Packed)
        bytes32 courierHash;    // Slot 4: 256 bits
    }

    // =========================
    // STORAGE
    // =========================
    uint256 public batchCount;
    uint256 public nextTxId;

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => PendingTx) public pendingTxs;
    mapping(address => uint256) public nonces;

    // =========================
    // EVENTS
    // =========================
    event BatchMinted(uint256 indexed batchId, address indexed company, uint256 supply);
    event TransferInitiated(uint256 indexed txId, uint256 indexed batchId, address indexed from, address to, uint256 amount);
    event Redeemed(uint256 indexed txId, address indexed user);
    event TransferCancelled(uint256 indexed txId, address indexed sender);
    event BatchFrozen(uint256 indexed batchId);
    event BatchUnfrozen(uint256 indexed batchId);
    
    // Admin Events
    event TokensSeized(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount);
    event DisputeResolved(uint256 indexed txId, address indexed awardTo);
    event MetadataUpdated(uint256 indexed batchId, bytes32 newHash);

    // =========================
    // CONSTRUCTOR
    // =========================
    constructor() ERC1155("") EIP712("Pharbit", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(COMPANY_ROLE, msg.sender);
    }

    // =========================
    // ADMIN MANAGEMENT
    // =========================
    function addAdmin(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, user);
    }
    function removeAdmin(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, user);
    }
    function addCompany(address company) external onlyRole(ADMIN_ROLE) {
        grantRole(COMPANY_ROLE, company);
    }
    function removeCompany(address company) external onlyRole(ADMIN_ROLE) {
        revokeRole(COMPANY_ROLE, company);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // =========================
    // ADMIN EMERGENCY ACTIONS
    // =========================
    function seizeTokens(address from, address to, uint256 batchId, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (batchId >= batchCount) revert InvalidBatch();
        // Force transfer using internal function (bypasses approvals)
        _safeTransferFrom(from, to, batchId, amount, "");
        emit TokensSeized(batchId, from, to, amount);
    }

    function resolveDispute(uint256 txId, address awardTo) external onlyRole(ADMIN_ROLE) {
        PendingTx storage p = pendingTxs[txId];
        if (!p.active) revert InactiveTransaction();
        if (awardTo != p.from && awardTo != p.to) revert InvalidAddress();

        p.active = false;
        
        _safeTransferFrom(address(this), awardTo, p.batchId, p.amount, "");
        emit DisputeResolved(txId, awardTo);
    }

    function updateMetadata(uint256 batchId, bytes32 newHash) external onlyRole(ADMIN_ROLE) {
        if (batchId >= batchCount) revert InvalidBatch();
        batches[batchId].metadataHash = newHash;
        emit MetadataUpdated(batchId, newHash);
    }


    // =========================
    // COMPANY MINT (SELF)
    // =========================
    function mintBatch(uint128 supply, uint128 pricePerToken, bytes32 metadataHash) external whenNotPaused onlyRole(COMPANY_ROLE) {
        if (supply == 0) revert InvalidAmount();

        uint256 batchId = batchCount++;

        batches[batchId] = Batch({
            company: msg.sender,
            totalSupply: supply,
            pricePerToken: pricePerToken,
            metadataHash: metadataHash,
            active: true
        });

        _mint(msg.sender, batchId, supply, "");
        emit BatchMinted(batchId, msg.sender, supply);
    }

    // =========================
    // SEND TOKENS (ESCROW)
    // =========================
    function sendTokens(uint256 batchId, uint128 amount, address receiver, uint128 pricePerToken, bytes32 courierHash) external whenNotPaused {
        if (batchId >= batchCount) revert InvalidBatch();
        if (!batches[batchId].active) revert InactiveBatch();
        if (receiver == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _safeTransferFrom(msg.sender, address(this), batchId, amount, "");

        uint256 txId = ++nextTxId;

        pendingTxs[txId] = PendingTx({
            from: msg.sender,
            to: receiver,
            amount: uint96(amount),
            pricePerToken: pricePerToken,
            courierHash: courierHash,
            batchId: uint128(batchId),
            active: true
        });

        emit TransferInitiated(txId, batchId, msg.sender, receiver, amount);
    }

    // =========================
    // GASLESS REDEEM
    // =========================
    function redeemMeta(uint256 txId, address user, string calldata courierId, bytes calldata signature) external whenNotPaused {
        PendingTx storage p = pendingTxs[txId];

        if (!p.active) revert InactiveTransaction();
        if (p.to != user) revert Unauthorized();
        if (!batches[p.batchId].active) revert InactiveBatch();
        if (keccak256(abi.encodePacked(courierId)) != p.courierHash) revert BadCourierID();

        bytes32 structHash = keccak256(abi.encode(REDEEM_TYPEHASH, txId, user, nonces[user]));
        bytes32 hash = _hashTypedDataV4(structHash);
        
        address signer = hash.recover(signature);
        if (signer != user) revert InvalidSignature();

        unchecked { nonces[user]++; }
        p.active = false;

        _safeTransferFrom(address(this), user, p.batchId, p.amount, "");
        emit Redeemed(txId, user);
    }

    // =========================
    // DIRECT REDEEM
    // =========================
    function redeem(uint256 txId, string calldata courierId) external whenNotPaused {
        PendingTx storage p = pendingTxs[txId];

        if (!p.active) revert InactiveTransaction();
        if (p.to != msg.sender) revert Unauthorized();
        if (!batches[p.batchId].active) revert InactiveBatch();
        if (keccak256(abi.encodePacked(courierId)) != p.courierHash) revert BadCourierID();

        p.active = false;

        _safeTransferFrom(address(this), msg.sender, p.batchId, p.amount, "");
        emit Redeemed(txId, msg.sender);
    }

    // =========================
    // CANCEL TRANSFER
    // =========================
    function cancelTransfer(uint256 txId) external whenNotPaused {
        PendingTx storage p = pendingTxs[txId];
        if (!p.active) revert InactiveTransaction();
        if (p.from != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();

        p.active = false;
        
        _safeTransferFrom(address(this), p.from, p.batchId, p.amount, "");
        emit TransferCancelled(txId, p.from);
    }

    // =========================
    // FREEZE / UNFREEZE
    // =========================
    function freezeBatch(uint256 batchId) external {
        if (batchId >= batchCount) revert InvalidBatch();
        if (batches[batchId].company != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        
        batches[batchId].active = false;
        emit BatchFrozen(batchId);
    }

    function unfreezeBatch(uint256 batchId) external {
        if (batchId >= batchCount) revert InvalidBatch();
        if (batches[batchId].company != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();

        batches[batchId].active = true;
        emit BatchUnfrozen(batchId);
    }

    // =========================
    // VERIFY METADATA
    // =========================
    function verifyMetadata(uint256 batchId, bytes32 hashToCheck) external view returns (bool) {
        if (batchId >= batchCount) revert InvalidBatch();
        return batches[batchId].metadataHash == hashToCheck;
    }

    // =========================
    // ERC1155 OVERRIDES
    // =========================
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        // Enforce freeze logic: allow transfers only if batch is active, 
        // or if returning the tokens to the original company, or if minting (from == address(0)).
        if (from != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                Batch memory b = batches[ids[i]];
                // Revert if inactive AND not returning to the company
                if (!b.active && to != b.company) {
                    revert InactiveBatch();
                }
            }
        }
        super._update(from, to, ids, values);
    }

    // =========================
    // INTERFACE SUPPORT
    // =========================
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC1155Holder, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}