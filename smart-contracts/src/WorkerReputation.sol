// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract WorkerReputation is Initializable, OwnableUpgradeable, UUPSUpgradeable {

    // Types 
    struct WorkerStats {
        uint256 tasksCompleted;
        uint256 tasksAttempted;
        uint256 totalEarned;    
        uint8   tier;
        uint256 tokenId;        
    }

    // State 

    address public escrow;

    uint256 private _tokenCounter;

    string public baseTokenURI;

    mapping(address  => WorkerStats) public stats;
    mapping(uint256  => address)     public tokenOwner;
    mapping(address  => uint256)     public workerToken;

 
    uint256[45] private __gap;

    // Events 
    event ReputationUpdated(address indexed worker, uint256 completed, uint8 tier);
    event NFTMinted(address indexed worker, uint256 tokenId);
    event TierUpgraded(address indexed worker, uint8 newTier);
    event EscrowUpdated(address indexed oldEscrow, address indexed newEscrow);
    event BaseTokenURISet(string uri);

    // ─Errors 
    error NotEscrow();
    error NonTransferable();
    error ZeroAddress();
    error TokenDoesNotExist();

    // Modifiers 
    modifier onlyEscrow() {
        if (msg.sender != escrow) revert NotEscrow();
        _;
    }

    
    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    
    function setEscrow(address _escrow) external onlyOwner {
        if (_escrow == address(0)) revert ZeroAddress();
        address old = escrow;
        escrow = _escrow;
        emit EscrowUpdated(old, _escrow);
    }

   
    function setBaseTokenURI(string calldata uri) external onlyOwner {
        baseTokenURI = uri;
        emit BaseTokenURISet(uri);
    }

    
    function recordCompletion(
        address worker,
        uint256 taskId,
        bool    approved,
        uint256 amount
    ) external onlyEscrow {
        WorkerStats storage s = stats[worker];

        s.tasksAttempted++;
        if (approved) {
            s.tasksCompleted++;
            s.totalEarned += amount; 
        }

        // Mint soul-bound NFT on first approved completion
        if (s.tokenId == 0 && s.tasksCompleted >= 1) {
            _mintNFT(worker, s);
        }

        // Recalculate tier
        uint8 oldTier = s.tier;
        s.tier = _calculateTier(s.tasksCompleted, s.tasksAttempted);

        emit ReputationUpdated(worker, s.tasksCompleted, s.tier);

        if (s.tier > oldTier) {
            emit TierUpgraded(worker, s.tier);
        }

       
        taskId;
    }


    function getStats(address worker) external view returns (WorkerStats memory) {
        return stats[worker];
    }

    function approvalRate(address worker) external view returns (uint256 bps) {
        WorkerStats storage s = stats[worker];
        if (s.tasksAttempted == 0) return 0;
        return (s.tasksCompleted * 10_000) / s.tasksAttempted;
    }

    function getTier(address worker) external view returns (uint8) {
        return stats[worker].tier;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwnerAddr = tokenOwner[tokenId];
        if (tokenOwnerAddr == address(0)) revert TokenDoesNotExist();
        return tokenOwnerAddr;
    }

   
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (tokenOwner[tokenId] == address(0)) revert TokenDoesNotExist();
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId)));
    }

    function totalSupply() external view returns (uint256) {
        return _tokenCounter;
    }

    
    function transferFrom(address, address, uint256) external pure {
        revert NonTransferable();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert NonTransferable();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert NonTransferable();
    }

    function _mintNFT(address worker, WorkerStats storage s) internal {
        uint256 id = ++_tokenCounter;
        s.tokenId           = id;
        tokenOwner[id]      = worker;
        workerToken[worker] = id;
        emit NFTMinted(worker, id);
    }

    function _calculateTier(
        uint256 completed,
        uint256 attempted
    ) internal pure returns (uint8) {
        if (completed == 0 || attempted == 0) return 0;

        uint256 rateBps = (completed * 10_000) / attempted;

        if (completed >= 50 && rateBps >= 8_000) return 3;
        if (completed >= 20 && rateBps >= 7_000) return 2;
        if (completed >= 5  && rateBps >= 6_000) return 1;
        return 0;
    }

    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
