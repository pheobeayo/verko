// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./WorkerReputation.sol";


contract TaskEscrow {

   

    enum TaskStatus {
        Open,        // accepting workers, within deadline
        InProgress,  // all slots filled, waiting on submissions/approvals
        Completed,   // all maxWorkers slots approved
        Cancelled,   // poster cancelled; escrow refunded
        Disputed,    // arbitration in progress
        Extended,    // deadline extended by poster; still accepting workers
        Past,        // deadline passed without completion
        Closed       // poster explicitly closed after a terminal state
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

    // Structs 
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
        uint8   extensionCount;   // number of times the deadline has been extended
        TaskStatus status;
        VerificationMethod verificationMethod;
        string  verificationRef;
        uint256 totalEscrowed;    // G$ remaining in escrow for this task
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

    // Constants 
    uint8   public constant MAX_EXTENSIONS = 3;
    uint64  public constant MIN_EXTENSION  = 1 hours;
    uint64  public constant MAX_EXTENSION  = 30 days;

    // State 

    WorkerReputation public immutable reputation;

    address public arbitration;
    address public owner;
    address public verifier;
    uint16  public platformFeeBps;

    uint256 private _taskCounter;

    mapping(uint256 => Task)                           public tasks;
    mapping(uint256 => mapping(address => Submission)) public submissions;
    mapping(uint256 => address[])                      private _taskWorkers;
    mapping(uint256 => mapping(address => bool))       public hasJoined;
    mapping(address => bool)                           public workerVerified;
    mapping(address => uint256)                        public feesCollected;

    // Events 
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
    event WorkerVerified(address indexed worker);
    event FeesWithdrawn(address indexed token, uint256 amount);
    event ArbitrationSet(address indexed arbitration);

    // Errors 
    error NotOwner();
    error NotVerifier();
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
    error TransferFailed();
    error InvalidSubmissionStatus();
    error ArbitrationNotSet();
    error ZeroAddress();
    error TaskAlreadyClosed();
    error TaskNotCloseable();
    error NewDeadlineMustBeLater();
    error MaxExtensionsReached();
    error ExtensionTooShort();
    error ExtensionTooLong();

    // Modifiers 
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert NotVerifier();
        _;
    }

    modifier onlyPoster(uint256 taskId) {
        if (msg.sender != tasks[taskId].poster) revert NotPoster();
        _;
    }

    // Constructor 

    constructor(address _reputation, address _verifier, uint16 _platformFeeBps) {
        if (_reputation == address(0) || _verifier == address(0)) revert ZeroAddress();
        reputation     = WorkerReputation(_reputation);
        verifier       = _verifier;
        platformFeeBps = _platformFeeBps;
        owner          = msg.sender;
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

            // Refund unfilled / unapproved escrow immediately on settlement
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

   
    function createTask(TaskParams calldata p) external returns (uint256 taskId) {
        if (p.maxWorkers == 0)             revert MaxWorkersMustBePositive();
        if (p.deadline <= block.timestamp) revert DeadlineMustBeFuture();

        bool    isPaid   = p.bountyPerWorker > 0;
        uint256 escrowed;

        if (isPaid) {
            if (p.paymentToken == address(0)) revert ZeroAddress();
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

   
    function extendDeadline(uint256 taskId, uint64 extraSeconds)
        external
        onlyPoster(taskId)
    {
        Task storage t = tasks[taskId];

        // Cannot extend terminal states
        if (
            t.status == TaskStatus.Completed ||
            t.status == TaskStatus.Cancelled ||
            t.status == TaskStatus.Closed
        ) revert TaskNotOpen();

        if (t.extensionCount >= MAX_EXTENSIONS) revert MaxExtensionsReached();
        if (extraSeconds < MIN_EXTENSION)        revert ExtensionTooShort();
        if (extraSeconds > MAX_EXTENSION)        revert ExtensionTooLong();

        uint64 oldDeadline = t.deadline;
        uint64 newDeadline = t.deadline + extraSeconds;

        if (newDeadline <= uint64(block.timestamp)) revert DeadlineMustBeFuture();

        // If the task was Past and we're now extending, undo the past refund
        // is NOT possible once funds have left — so we only re-open the status.
        TaskStatus prevStatus = t.status;
        t.deadline        = newDeadline;
        t.extensionCount += 1;

        if (prevStatus == TaskStatus.Past) {
            // Re-open for new workers if slots remain; otherwise InProgress
            t.status = (t.currentWorkers < t.maxWorkers)
                ? TaskStatus.Extended
                : TaskStatus.InProgress;
        } else if (prevStatus == TaskStatus.Open) {
            t.status = TaskStatus.Extended;
        }
        // Extended → Extended, InProgress → InProgress, Disputed → Disputed

        emit TaskExtended(taskId, oldDeadline, newDeadline, t.extensionCount);
    }

    
    function cancelTask(uint256 taskId) external onlyPoster(taskId) {
        Task storage t = tasks[taskId];
        _checkAndMarkPast(taskId); // settle expiry first

        if (
            t.status != TaskStatus.Open       &&
            t.status != TaskStatus.InProgress &&
            t.status != TaskStatus.Extended   &&
            t.status != TaskStatus.Past
        ) revert TaskNotOpen();

        t.status = TaskStatus.Cancelled;
        _refundEscrow(t);       // returns unfilled/unapproved slots' G$
        emit TaskCancelled(taskId);
    }

    
    function closeTask(uint256 taskId) external onlyPoster(taskId) {
        Task storage t = tasks[taskId];
        _checkAndMarkPast(taskId); // settle expiry first

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

     function settlePastTask(uint256 taskId) external {
       Task storage t = tasks[taskId];

    // Must be a live state that has passed its deadline
    if (
        t.status != TaskStatus.Open     &&
        t.status != TaskStatus.InProgress &&
        t.status != TaskStatus.Extended
    ) revert TaskNotOpen();

    if (block.timestamp < t.deadline) revert TaskNotOpen();

    t.status = TaskStatus.Past;
    emit TaskMarkedPast(taskId);
    _refundEscrow(t);
   }

    function approveSubmission(uint256 taskId, address worker)
        external
        onlyPoster(taskId)
    {
        Task storage t         = tasks[taskId];
        Submission storage sub = submissions[taskId][worker];

        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();

        sub.status = SubmissionStatus.Approved;
        t.approvedCount++;

        if (t.isPaid && t.bountyPerWorker > 0) {
            t.totalEscrowed -= t.bountyPerWorker;
            bool ok = _safeTransfer(t.paymentToken, worker, t.bountyPerWorker);
            if (!ok) revert TransferFailed();
            emit SubmissionApproved(taskId, worker, t.bountyPerWorker);
        } else {
            emit SubmissionApproved(taskId, worker, 0);
        }

        reputation.recordCompletion(worker, taskId, true);

        if (t.approvedCount == t.maxWorkers) {
            t.status = TaskStatus.Completed;
            // Return any rounding dust
            _refundEscrow(t);
        }
    }

    function rejectSubmission(uint256 taskId, address worker, string calldata reason)
        external
        onlyPoster(taskId)
    {
        Task storage t         = tasks[taskId];
        Submission storage sub = submissions[taskId][worker];

        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();

        sub.status          = SubmissionStatus.Rejected;
        sub.rejectionReason = reason;

        t.currentWorkers--;
        hasJoined[taskId][worker] = false;

        if (block.timestamp < t.deadline) {
            // Slot is now free — revert InProgress back to Open/Extended
            if (t.status == TaskStatus.InProgress) {
                t.status = (t.extensionCount > 0) ? TaskStatus.Extended : TaskStatus.Open;
            }
        } else {
            _checkAndMarkPast(taskId);
        }

        reputation.recordCompletion(worker, taskId, false);
        emit SubmissionRejected(taskId, worker, reason);
    }

    function raiseDispute(uint256 taskId, address worker)
        external
        onlyPoster(taskId)
    {
        if (arbitration == address(0)) revert ArbitrationNotSet();
        Submission storage sub = submissions[taskId][worker];
        if (sub.status != SubmissionStatus.Submitted) revert InvalidSubmissionStatus();

        sub.status           = SubmissionStatus.Disputed;
        tasks[taskId].status = TaskStatus.Disputed;

        (bool ok,) = arbitration.call(
            abi.encodeWithSignature("openDispute(uint256,address,address)", taskId, worker, tasks[taskId].poster)
        );
        require(ok, "ArbitrationPool call failed");
        emit SubmissionDisputed(taskId, worker);
    }

    function joinTask(uint256 taskId) external {
        if (!workerVerified[msg.sender]) revert WorkerNotVerified();

        Task storage t = tasks[taskId];

        if (_checkAndMarkPast(taskId)) revert TaskExpired();
        if (t.currentWorkers >= t.maxWorkers) revert TaskFull();
        if (
            t.status != TaskStatus.Open &&
            t.status != TaskStatus.Extended
        ) revert TaskNotOpen();
        if (hasJoined[taskId][msg.sender]) revert AlreadyJoined();

        hasJoined[taskId][msg.sender] = true;
        t.currentWorkers++;
        _taskWorkers[taskId].push(msg.sender);

        // All slots filled → InProgress
        if (t.currentWorkers == t.maxWorkers) {
            t.status = TaskStatus.InProgress;
        }

        emit WorkerJoined(taskId, msg.sender);
    }

    function submitProof(uint256 taskId, string calldata proofData) external {

        if (!hasJoined[taskId][msg.sender]) revert NotJoined();
        if (_checkAndMarkPast(taskId))       revert TaskExpired();

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

    function resolveDispute(uint256 taskId, address worker, bool inFavourOfWorker) external {
        if (msg.sender != arbitration) revert NotArbitration();

        Task storage t         = tasks[taskId];
        Submission storage sub = submissions[taskId][worker];

        if (inFavourOfWorker) {
            sub.status = SubmissionStatus.Approved;
            t.approvedCount++;
            if (t.isPaid && t.bountyPerWorker > 0) {
                t.totalEscrowed -= t.bountyPerWorker;
                _safeTransfer(t.paymentToken, worker, t.bountyPerWorker);
            }
            reputation.recordCompletion(worker, taskId, true);
            emit SubmissionApproved(taskId, worker, t.bountyPerWorker);
        } else {
            sub.status = SubmissionStatus.Rejected;
            reputation.recordCompletion(worker, taskId, false);
            t.currentWorkers--;
            hasJoined[taskId][worker] = false;
            emit SubmissionRejected(taskId, worker, "Arbitration: ruled against worker");
        }

        if (t.status == TaskStatus.Disputed) {
            if (t.approvedCount == t.maxWorkers) {
                t.status = TaskStatus.Completed;
                _refundEscrow(t);
            } else {
                // Return to appropriate live state based on deadline
                t.status = (block.timestamp < t.deadline)
                    ? (t.extensionCount > 0 ? TaskStatus.Extended : TaskStatus.Open)
                    : TaskStatus.Past;
                if (t.status == TaskStatus.Past) _refundEscrow(t);
            }
        }
    }

    // Admin 
    function setWorkerVerified(address worker) external onlyVerifier {
        workerVerified[worker] = true;
        emit WorkerVerified(worker);
    }

    function setVerifier(address _verifier) external onlyOwner {
        if (_verifier == address(0)) revert ZeroAddress();
        verifier = _verifier;
    }

    function setArbitration(address _arbitration) external onlyOwner {
        arbitration = _arbitration;
        emit ArbitrationSet(_arbitration);
    }

    function setPlatformFee(uint16 bps) external onlyOwner {
        require(bps <= 1000, "Fee too high");
        platformFeeBps = bps;
    }

    function withdrawFees(address token) external onlyOwner {
        uint256 amount = feesCollected[token];
        feesCollected[token] = 0;
        bool ok = _safeTransfer(token, owner, amount);
        if (!ok) revert TransferFailed();
        emit FeesWithdrawn(token, amount);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }


    function getTaskStatus(uint256 taskId) external view returns (TaskStatus) {
        Task storage t      = tasks[taskId];
        TaskStatus   stored = t.status;

        // Terminal states are never overridden by deadline
        if (
            stored == TaskStatus.Completed ||
            stored == TaskStatus.Cancelled ||
            stored == TaskStatus.Closed    ||
            stored == TaskStatus.Disputed
        ) return stored;

        // If deadline has elapsed and task is still live → Past
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
