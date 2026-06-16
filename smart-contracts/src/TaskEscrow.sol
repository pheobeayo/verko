// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "./WorkerReputation.sol";

interface IGoodDollarIdentity {
    function isWhitelisted(address user) external view returns (bool);
}

contract TaskEscrow is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    enum TaskStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Disputed,
        Extended,
        Past,
        Closed
    }

    enum SubmissionStatus {
        None,
        Submitted,
        Approved,
        Rejected,
        Disputed
    }

    enum VerificationMethod {
        OnChainText,
        GoogleForm,
        Email,
        SocialPost,
        Custom
    }

    struct Task {
        uint256 id;
        address poster;
        string  title;
        string  description;
        string  category;
        bool    isPaid;
        uint256 bountyPerWorker;
        address paymentToken;
        uint32  maxWorkers;
        uint32  currentWorkers;
        uint32  approvedCount;
        uint64  deadline;
        uint8   extensionCount;
        TaskStatus status;
        VerificationMethod verificationMethod;
        string  verificationRef;
        uint256 totalEscrowed;
    }

    struct Submission {
        address worker;
        string  proofData;
        SubmissionStatus status;
        string  rejectionReason;
        uint256 submittedAt;
    }

    struct TaskParams {
        string  title;
        string  description;
        string  category;
        uint256 bountyPerWorker;
        address paymentToken;
        uint32  maxWorkers;
        uint64  deadline;
        VerificationMethod verificationMethod;
        string  verificationRef;
    }

    uint8   public constant MAX_EXTENSIONS       = 3;
    uint64  public constant MIN_EXTENSION        = 1 hours;
    uint64  public constant MAX_EXTENSION        = 30 days;
    uint32  public constant MAX_WORKERS_LIMIT    = 1000;
    uint256 public constant MINIMUM_BOUNTY       = 1000000000000000000;
    uint64  public constant APPROVAL_TIMEOUT     = 7 days;
    uint64  public constant GD_IDENTITY_TIMELOCK = 2 days;

    WorkerReputation public reputation;

    address public arbitration;
    uint16  public platformFeeBps;

    address public gdIdentity;
    address public pendingGDIdentity;
    uint64  public gdIdentityUnlockTime;

    uint256 private _taskCounter;

    mapping(uint256 => Task)                           public tasks;
    mapping(uint256 => mapping(address => Submission)) public submissions;
    mapping(uint256 => address[])                      private _taskWorkers;
    mapping(uint256 => mapping(address => bool))       public hasJoined;
    mapping(address => uint256)                        public feesCollected;

    uint256[40] private __gap;

    event TaskCreated(uint256 indexed taskId, address indexed poster, bool isPaid, uint256 bountyPerWorker, uint32 maxWorkers, VerificationMethod verificationMethod);
    event TaskExtended(uint256 indexed taskId, uint64 oldDeadline, uint64 newDeadline, uint8 extensionCount);
    event TaskMarkedPast(uint256 indexed taskId);
    event TaskCancelled(uint256 indexed taskId);
    event TaskClosed(uint256 indexed taskId, uint256 refundAmount);
    event PartialRefund(uint256 indexed taskId, address indexed poster, uint256 amount);
    event WorkerJoined(uint256 indexed taskId, address indexed worker);
    event ProofSubmitted(uint256 indexed taskId, address indexed worker, string proofData);
    event SubmissionApproved(uint256 indexed taskId, address indexed worker, uint256 payout);
    event SubmissionRejected(uint256 indexed taskId, address indexed worker, string reason);
    event SubmissionDisputed(uint256 indexed taskId, address indexed worker);
    event AutoApprovalClaimed(uint256 indexed taskId, address indexed worker, uint256 payout);
    event FeesWithdrawn(address indexed token, uint256 amount);
    event ArbitrationSet(address indexed arbitration);
    event GDIdentityProposed(address indexed proposed, uint64 unlockTime);
    event GDIdentityUpdated(address indexed oldIdentity, address indexed newIdentity);

    error NotPoster();
    error NotArbitration();
    error TaskNotOpen();
    error TaskExpired();
    error TaskFull();
    error AlreadyJoined();
    error NotJoined();
    error AlreadySubmitted();
    error WorkerNotVerified();
    error DeadlineMustBeFuture();
    error MaxWorkersMustBePositive();
    error MaxWorkersExceedsLimit();
    error BountyBelowMinimum();
    error TransferFailed();
    error InvalidSubmissionStatus();
    error ArbitrationNotSet();
    error ZeroAddress();
    error TaskAlreadyClosed();
    error TaskNotCloseable();
    error MaxExtensionsReached();
    error ExtensionTooShort();
    error ExtensionTooLong();
    error ApprovalTimeoutNotReached();
    error NoEscrowToExtend();
    error TimelockNotExpired();
    error NoPendingIdentity();
    error FeeTooHigh();

    modifier onlyPoster(uint256 taskId) {
        if (msg.sender != tasks[taskId].poster) revert NotPoster();
        _;
    }

    /// @notice Initializer -- replaces constructor for UUPS proxy pattern.
    ///         OZ v4: __Ownable_init() takes no args; owner = msg.sender by default.
    ///         We then transfer ownership to initialOwner if different.
    function initialize(
        address _reputation,
        address _gdIdentity,
        uint16  _platformFeeBps,
        address initialOwner
    ) external initializer {
        if (_reputation  == address(0)) revert ZeroAddress();
        if (_gdIdentity  == address(0)) revert ZeroAddress();
        if (initialOwner == address(0)) revert ZeroAddress();
        if (_platformFeeBps > 1000)     revert FeeTooHigh();

        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        reputation     = WorkerReputation(_reputation);
        gdIdentity     = _gdIdentity;
        platformFeeBps = _platformFeeBps;

        if (initialOwner != msg.sender) {
            _transferOwnership(initialOwner);
        }
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _isGoodDollarVerified(address user) internal view returns (bool) {
        try IGoodDollarIdentity(gdIdentity).isWhitelisted(user) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }

    function _checkAndMarkPast(uint256 taskId) internal returns (bool expired) {
        Task storage t = tasks[taskId];
        if (block.timestamp < t.deadline) return false;

        if (
            t.status == TaskStatus.Open       ||
            t.status == TaskStatus.InProgress ||
            t.status == TaskStatus.Extended
        ) {
            t.status = TaskStatus.Past;
            emit TaskMarkedPast(taskId);
            _refundEscrow(t);
        }
        return true;
    }

    function _refundEscrow(Task storage t) internal {
        if (!t.isPaid || t.totalEscrowed == 0) return;
        uint256 refund  = t.totalEscrowed;
        t.totalEscrowed = 0;
        bool ok = _safeTransfer(t.paymentToken, t.poster, refund);
        if (!ok) revert TransferFailed();
        emit PartialRefund(t.id, t.poster, refund);
    }

    function createTask(TaskParams calldata p)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 taskId)
    {
        if (p.maxWorkers == 0)                     revert MaxWorkersMustBePositive();
        if (p.maxWorkers > MAX_WORKERS_LIMIT)       revert MaxWorkersExceedsLimit();
        if (p.deadline <= block.timestamp)          revert DeadlineMustBeFuture();

        bool    isPaid   = p.bountyPerWorker > 0;
        uint256 escrowed;

        if (isPaid) {
            if (p.paymentToken == address(0))       revert ZeroAddress();
            if (p.bountyPerWorker < MINIMUM_BOUNTY) revert BountyBelowMinimum();

            uint256 gross = p.bountyPerWorker * p.maxWorkers;
            uint256 fee   = (gross * platformFeeBps) / 10_000;
            bool ok = _safeTransferFrom(p.paymentToken, msg.sender, address(this), gross + fee);
            if (!ok) revert TransferFailed();
            feesCollected[p.paymentToken] += fee;
            escrowed = gross;
        }

        taskId = ++_taskCounter;
        tasks[taskId] = Task({
            id:                 taskId,
            poster:             msg.sender,
            title:              p.title,
            description:        p.description,
            category:           p.category,
            isPaid:             isPaid,
            bountyPerWorker:    p.bountyPerWorker,
            paymentToken:       isPaid ? p.paymentToken : address(0),
            maxWorkers:         p.maxWorkers,
            currentWorkers:     0,
            approvedCount:      0,
            deadline:           p.deadline,
            extensionCount:     0,
            status:             TaskStatus.Open,
            verificationMethod: p.verificationMethod,
            verificationRef:    p.verificationRef,
            totalEscrowed:      escrowed
        });

        emit TaskCreated(taskId, msg.sender, isPaid, p.bountyPerWorker, p.maxWorkers, p.verificationMethod);
    }

    function joinTask(uint256 taskId) external whenNotPaused {
        if (!_isGoodDollarVerified(msg.sender)) revert WorkerNotVerified();

        Task storage t = tasks[taskId];

        if (_checkAndMarkPast(taskId))         revert TaskExpired();
        if (t.currentWorkers >= t.maxWorkers)  revert TaskFull();
        if (
            t.status != TaskStatus.Open &&
            t.status != TaskStatus.Extended
        ) revert TaskNotOpen();
        if (hasJoined[taskId][msg.sender])     revert AlreadyJoined();

        hasJoined[taskId][msg.sender] = true;
        t.currentWorkers++;
        _taskWorkers[taskId].push(msg.sender);

        if (t.currentWorkers == t.maxWorkers) {
            t.status = TaskStatus.InProgress;
        }

        emit WorkerJoined(taskId, msg.sender);
    }

    function submitProof(uint256 taskId, string calldata proofData) external whenNotPaused {
        if (!hasJoined[taskId][msg.sender]) revert NotJoined();
        if (_checkAndMarkPast(taskId))      revert TaskExpired();

        Submission storage sub = submissions[taskId][msg.sender];
        if (
            sub.status != SubmissionStatus.None &&
            sub.status != SubmissionStatus.Rejected
        ) revert AlreadySubmitted();

        submissions[taskId][msg.sender] = Submission({
            worker:          msg.sender,
            proofData:       proofData,
            status:          SubmissionStatus.Submitted,
            rejectionReason: "",
            submittedAt:     block.timestamp
        });

        emit ProofSubmitted(taskId, msg.sender, proofData);
    }

    function approveSubmission(uint256 taskId, address worker)
        external
        onlyPoster(taskId)
        nonReentrant
        whenNotPaused
    {
        Task storage t         = tasks[taskId];
        Submission storage sub = submissions[taskId][worker];

        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();

        // State changes first (CEI pattern)
        sub.status = SubmissionStatus.Approved;
        t.approvedCount++;

        uint256 payout;
        if (t.isPaid && t.bountyPerWorker > 0) {
            payout = t.bountyPerWorker;
            t.totalEscrowed -= payout;
        }

        bool taskComplete = (t.approvedCount == t.maxWorkers);
        if (taskComplete) {
            t.status = TaskStatus.Completed;
        }

        // External calls after state changes
        if (payout > 0) {
            bool ok = _safeTransfer(t.paymentToken, worker, payout);
            if (!ok) revert TransferFailed();
        }

        reputation.recordCompletion(worker, taskId, true, payout);
        emit SubmissionApproved(taskId, worker, payout);

        if (taskComplete) {
            _refundEscrow(t);
        }
    }

    function rejectSubmission(uint256 taskId, address worker, string calldata reason)
        external
        onlyPoster(taskId)
        nonReentrant
        whenNotPaused
    {
        Task storage t         = tasks[taskId];
        Submission storage sub = submissions[taskId][worker];

        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();

        sub.status          = SubmissionStatus.Rejected;
        sub.rejectionReason = reason;
        t.currentWorkers--;
        hasJoined[taskId][worker] = false;

        if (block.timestamp < t.deadline) {
            if (t.status == TaskStatus.InProgress) {
                t.status = (t.extensionCount > 0) ? TaskStatus.Extended : TaskStatus.Open;
            }
        } else {
            _checkAndMarkPast(taskId);
        }

        reputation.recordCompletion(worker, taskId, false, 0);
        emit SubmissionRejected(taskId, worker, reason);
    }

    /// @notice Worker claims auto-approval if poster ignored submission for 7 days.
    function claimAutoApproval(uint256 taskId) external nonReentrant whenNotPaused {
        if (!hasJoined[taskId][msg.sender]) revert NotJoined();

        Submission storage sub = submissions[taskId][msg.sender];
        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();
        if (block.timestamp < sub.submittedAt + APPROVAL_TIMEOUT)
            revert ApprovalTimeoutNotReached();

        Task storage t = tasks[taskId];

        sub.status = SubmissionStatus.Approved;
        t.approvedCount++;

        uint256 payout;
        if (t.isPaid && t.bountyPerWorker > 0) {
            payout = t.bountyPerWorker;
            t.totalEscrowed -= payout;
        }

        bool taskComplete = (t.approvedCount == t.maxWorkers);
        if (taskComplete) {
            t.status = TaskStatus.Completed;
        }

        if (payout > 0) {
            bool ok = _safeTransfer(t.paymentToken, msg.sender, payout);
            if (!ok) revert TransferFailed();
        }

        reputation.recordCompletion(msg.sender, taskId, true, payout);
        emit AutoApprovalClaimed(taskId, msg.sender, payout);

        if (taskComplete) {
            _refundEscrow(t);
        }
    }

    function extendDeadline(uint256 taskId, uint64 extraSeconds)
        external
        onlyPoster(taskId)
        whenNotPaused
    {
        Task storage t = tasks[taskId];

        _checkAndMarkPast(taskId);

        if (
            t.status == TaskStatus.Completed ||
            t.status == TaskStatus.Cancelled ||
            t.status == TaskStatus.Closed
        ) revert TaskNotOpen();

        if (t.status == TaskStatus.Past && t.isPaid && t.totalEscrowed == 0)
            revert NoEscrowToExtend();

        if (t.extensionCount >= MAX_EXTENSIONS) revert MaxExtensionsReached();
        if (extraSeconds < MIN_EXTENSION)       revert ExtensionTooShort();
        if (extraSeconds > MAX_EXTENSION)       revert ExtensionTooLong();

        uint64 oldDeadline = t.deadline;
        uint64 newDeadline = t.deadline + extraSeconds;

        if (newDeadline <= uint64(block.timestamp)) revert DeadlineMustBeFuture();

        TaskStatus prevStatus = t.status;
        t.deadline       = newDeadline;
        t.extensionCount += 1;

        if (prevStatus == TaskStatus.Past) {
            t.status = (t.currentWorkers < t.maxWorkers)
                ? TaskStatus.Extended
                : TaskStatus.InProgress;
        } else if (prevStatus == TaskStatus.Open) {
            t.status = TaskStatus.Extended;
        }

        emit TaskExtended(taskId, oldDeadline, newDeadline, t.extensionCount);
    }

    function cancelTask(uint256 taskId)
        external
        onlyPoster(taskId)
        nonReentrant
        whenNotPaused
    {
        Task storage t = tasks[taskId];
        _checkAndMarkPast(taskId);

        if (
            t.status != TaskStatus.Open       &&
            t.status != TaskStatus.InProgress &&
            t.status != TaskStatus.Extended   &&
            t.status != TaskStatus.Past
        ) revert TaskNotOpen();

        t.status = TaskStatus.Cancelled;
        _refundEscrow(t);
        emit TaskCancelled(taskId);
    }

    function closeTask(uint256 taskId)
        external
        onlyPoster(taskId)
        nonReentrant
        whenNotPaused
    {
        Task storage t = tasks[taskId];
        _checkAndMarkPast(taskId);

        if (t.status == TaskStatus.Closed) revert TaskAlreadyClosed();
        if (
            t.status != TaskStatus.Completed &&
            t.status != TaskStatus.Cancelled &&
            t.status != TaskStatus.Past
        ) revert TaskNotCloseable();

        t.status = TaskStatus.Closed;
        uint256 refund = t.totalEscrowed;
        _refundEscrow(t);
        emit TaskClosed(taskId, refund);
    }

    function settlePastTask(uint256 taskId) external nonReentrant whenNotPaused {
        Task storage t = tasks[taskId];

        if (
            t.status != TaskStatus.Open       &&
            t.status != TaskStatus.InProgress &&
            t.status != TaskStatus.Extended
        ) revert TaskNotOpen();

        if (block.timestamp < t.deadline) revert TaskNotOpen();

        t.status = TaskStatus.Past;
        emit TaskMarkedPast(taskId);
        _refundEscrow(t);
    }

    function raiseDispute(uint256 taskId, address worker)
        external
        onlyPoster(taskId)
        whenNotPaused
    {
        if (arbitration == address(0)) revert ArbitrationNotSet();
        Submission storage sub = submissions[taskId][worker];
        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();

        sub.status           = SubmissionStatus.Disputed;
        tasks[taskId].status = TaskStatus.Disputed;

        (bool ok,) = arbitration.call(
            abi.encodeWithSignature(
                "openDispute(uint256,address,address)",
                taskId, worker, tasks[taskId].poster
            )
        );
        require(ok, "ArbitrationPool call failed");
        emit SubmissionDisputed(taskId, worker);
    }

    function resolveDispute(uint256 taskId, address worker, bool inFavourOfWorker)
        external
        nonReentrant
    {
        if (msg.sender != arbitration) revert NotArbitration();

        Task storage t         = tasks[taskId];
        Submission storage sub = submissions[taskId][worker];

        uint256 payout;

        if (inFavourOfWorker) {
            sub.status = SubmissionStatus.Approved;
            t.approvedCount++;
            if (t.isPaid && t.bountyPerWorker > 0) {
                payout = t.bountyPerWorker;
                t.totalEscrowed -= payout;
            }
        } else {
            sub.status = SubmissionStatus.Rejected;
            t.currentWorkers--;
            hasJoined[taskId][worker] = false;
        }

        bool taskComplete = (t.approvedCount == t.maxWorkers);

        if (t.status == TaskStatus.Disputed) {
            if (taskComplete) {
                t.status = TaskStatus.Completed;
            } else {
                t.status = (block.timestamp < t.deadline)
                    ? (t.extensionCount > 0 ? TaskStatus.Extended : TaskStatus.Open)
                    : TaskStatus.Past;
            }
        }

        if (inFavourOfWorker) {
            if (payout > 0) {
                bool ok = _safeTransfer(t.paymentToken, worker, payout);
                if (!ok) revert TransferFailed();
            }
            reputation.recordCompletion(worker, taskId, true, payout);
            emit SubmissionApproved(taskId, worker, payout);
        } else {
            reputation.recordCompletion(worker, taskId, false, 0);
            emit SubmissionRejected(taskId, worker, "Arbitration: ruled against worker");
        }

        if (taskComplete) {
            _refundEscrow(t);
        } else if (t.status == TaskStatus.Past) {
            _refundEscrow(t);
        }
    }

    // Admin functions

    function setArbitration(address _arbitration) external onlyOwner {
        arbitration = _arbitration;
        emit ArbitrationSet(_arbitration);
    }

    function setPlatformFee(uint16 bps) external onlyOwner {
        if (bps > 1000) revert FeeTooHigh();
        platformFeeBps = bps;
    }

    function withdrawFees(address token) external onlyOwner nonReentrant {
        uint256 amount = feesCollected[token];
        feesCollected[token] = 0;
        bool ok = _safeTransfer(token, owner(), amount);
        if (!ok) revert TransferFailed();
        emit FeesWithdrawn(token, amount);
    }

    function setReputation(address _reputation) external onlyOwner {
        if (_reputation == address(0)) revert ZeroAddress();
        reputation = WorkerReputation(_reputation);
    }

    /// @notice Step 1: propose a new GoodDollar Identity address (2-day timelock).
    function proposeGDIdentity(address _newIdentity) external onlyOwner {
        if (_newIdentity == address(0)) revert ZeroAddress();
        pendingGDIdentity    = _newIdentity;
        gdIdentityUnlockTime = uint64(block.timestamp) + GD_IDENTITY_TIMELOCK;
        emit GDIdentityProposed(_newIdentity, gdIdentityUnlockTime);
    }

    /// @notice Step 2: finalise the GoodDollar Identity update after the timelock.
    function acceptGDIdentity() external onlyOwner {
        if (pendingGDIdentity == address(0))        revert NoPendingIdentity();
        if (block.timestamp < gdIdentityUnlockTime) revert TimelockNotExpired();
        address old       = gdIdentity;
        gdIdentity        = pendingGDIdentity;
        pendingGDIdentity = address(0);
        emit GDIdentityUpdated(old, gdIdentity);
    }

    // View functions

    function isWorkerVerified(address worker) external view returns (bool) {
        return _isGoodDollarVerified(worker);
    }

    /// @notice Returns task with live effective status applied.
    function getTask(uint256 taskId) external view returns (Task memory task) {
        task = tasks[taskId];
        if (
            (task.status == TaskStatus.Open       ||
             task.status == TaskStatus.InProgress ||
             task.status == TaskStatus.Extended) &&
            block.timestamp >= task.deadline
        ) {
            task.status = TaskStatus.Past;
        }
    }

    function getTaskStatus(uint256 taskId) external view returns (TaskStatus) {
        Task storage t      = tasks[taskId];
        TaskStatus   stored = t.status;

        if (
            stored == TaskStatus.Completed ||
            stored == TaskStatus.Cancelled ||
            stored == TaskStatus.Closed    ||
            stored == TaskStatus.Disputed
        ) return stored;

        if (
            block.timestamp >= t.deadline &&
            (
                stored == TaskStatus.Open       ||
                stored == TaskStatus.InProgress ||
                stored == TaskStatus.Extended
            )
        ) return TaskStatus.Past;

        return stored;
    }

    function getSubmission(uint256 taskId, address worker)
        external view returns (Submission memory)
    {
        return submissions[taskId][worker];
    }

    function getTaskWorkers(uint256 taskId)
        external view returns (address[] memory)
    {
        return _taskWorkers[taskId];
    }

    function taskCount() external view returns (uint256) {
        return _taskCounter;
    }

    // Internal transfer helpers

    function _safeTransfer(address token, address to, uint256 amount)
        internal returns (bool)
    {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(0xa9059cbb, to, amount));
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount)
        internal returns (bool)
    {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(0x23b872dd, from, to, amount));
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }
}
