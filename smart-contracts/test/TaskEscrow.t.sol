// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/TaskEscrow.sol";
import "../src/WorkerReputation.sol";
import "../src/MockERC20.sol";

contract TaskEscrowTest is Test {

    // ── Constants ─────────────────────────────────────────────────────────
    uint16  constant FEE_BPS    = 600;
    uint256 constant ONE_DAY    = 86_400;
    uint256 constant ONE_HOUR   = 3_600;
    uint256 constant ONE_WEEK   = 7 * ONE_DAY;
    uint256 constant BOUNTY     = 100 ether;
    uint256 constant TOKEN_SUPPLY = 1_000_000 ether;

    // ── Contracts ─────────────────────────────────────────────────────────
    TaskEscrow       escrow;
    WorkerReputation reputation;
    MockERC20        token;

    // ── Actors ────────────────────────────────────────────────────────────
    address owner    = makeAddr("owner");
    address poster   = makeAddr("poster");
    address worker1  = makeAddr("worker1");
    address worker2  = makeAddr("worker2");
    address worker3  = makeAddr("worker3");
    address verifier = makeAddr("verifier");
    address stranger = makeAddr("stranger");

    // ── Setup ─────────────────────────────────────────────────────────────
    function setUp() public {
        vm.startPrank(owner);

        token      = new MockERC20(TOKEN_SUPPLY);
        reputation = new WorkerReputation();
        escrow     = new TaskEscrow(address(reputation), verifier, FEE_BPS);
        reputation.setEscrow(address(escrow));

        // Fund poster
        token.transfer(poster, 50_000 ether);

        vm.stopPrank();

        // Approve escrow from poster
        vm.prank(poster);
        token.approve(address(escrow), 50_000 ether);

        // Verify workers
        vm.startPrank(verifier);
        escrow.setWorkerVerified(worker1);
        escrow.setWorkerVerified(worker2);
        escrow.setWorkerVerified(worker3);
        vm.stopPrank();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    function _paidParams(uint256 bounty, uint32 maxWorkers, uint64 deadline)
        internal view returns (TaskEscrow.TaskParams memory)
    {
        return TaskEscrow.TaskParams({
            title:              "Test Task",
            description:        "Do the thing",
            category:           "Survey",
            bountyPerWorker:    bounty,
            paymentToken:       address(token),
            maxWorkers:         maxWorkers,
            deadline:           deadline,
            verificationMethod: TaskEscrow.VerificationMethod.OnChainText,
            verificationRef:    ""
        });
    }

    function _unpaidParams(uint32 maxWorkers, uint64 deadline)
        internal pure returns (TaskEscrow.TaskParams memory)
    {
        return TaskEscrow.TaskParams({
            title:              "Volunteer Task",
            description:        "Help out",
            category:           "Community",
            bountyPerWorker:    0,
            paymentToken:       address(0),
            maxWorkers:         maxWorkers,
            deadline:           deadline,
            verificationMethod: TaskEscrow.VerificationMethod.GoogleForm,
            verificationRef:    "https://forms.gle/test"
        });
    }

    function _createPaid(uint256 bounty, uint32 maxWorkers)
        internal returns (uint256 taskId)
    {
        uint64 deadline = uint64(block.timestamp + ONE_DAY);
        vm.prank(poster);
        taskId = escrow.createTask(_paidParams(bounty, maxWorkers, deadline));
    }

    function _createUnpaid(uint32 maxWorkers)
        internal returns (uint256 taskId)
    {
        uint64 deadline = uint64(block.timestamp + ONE_DAY);
        vm.prank(poster);
        taskId = escrow.createTask(_unpaidParams(maxWorkers, deadline));
    }

    function _join(address worker, uint256 taskId) internal {
        vm.prank(worker);
        escrow.joinTask(taskId);
    }

    function _submit(address worker, uint256 taskId, string memory proof) internal {
        vm.prank(worker);
        escrow.submitProof(taskId, proof);
    }

    function _approve(uint256 taskId, address worker) internal {
        vm.prank(poster);
        escrow.approveSubmission(taskId, worker);
    }

    function _reject(uint256 taskId, address worker) internal {
        vm.prank(poster);
        escrow.rejectSubmission(taskId, worker, "Wrong format");
    }

    // ════════════════════════════════════════════════════════════════════
    // WorkerReputation
    // ════════════════════════════════════════════════════════════════════

    function test_reputation_initialState() public view {
        WorkerReputation.WorkerStats memory s = reputation.getStats(worker1);
        uint256 completed = s.tasksCompleted;
        uint8 tier = s.tier;
        uint256 tokenId = s.tokenId;
        assertEq(completed, 0);
        assertEq(tier, 0);
        assertEq(tokenId, 0);
    }

    function test_reputation_onlyEscrowCanRecord() public {
        vm.expectRevert(abi.encodeWithSelector(WorkerReputation.NotEscrow.selector));
        reputation.recordCompletion(worker1, 1, true);
    }

    function test_reputation_mintsSoulboundNFTOnFirstApproval() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");
        _approve(taskId, worker1);

        WorkerReputation.WorkerStats memory s = reputation.getStats(worker1);
        uint256 completed = s.tasksCompleted;
        uint256 tokenId = s.tokenId;
        assertEq(completed, 1);
        assertGt(tokenId, 0);
        assertEq(reputation.ownerOf(tokenId), worker1);
    }

    function test_reputation_soulboundRevertsOnTransfer() public {
        vm.expectRevert(abi.encodeWithSelector(WorkerReputation.NonTransferable.selector));
        vm.prank(worker1);
        reputation.transferFrom(worker1, worker2, 1);
    }

    function test_reputation_tier1After5Completions() public {
        for (uint i = 0; i < 5; i++) {
            uint256 taskId = _createPaid(BOUNTY, 1);
            _join(worker1, taskId);
            _submit(worker1, taskId, string(abi.encodePacked("proof-", vm.toString(i))));
            _approve(taskId, worker1);
        }
        assertEq(reputation.getTier(worker1), 1);
    }

    // ════════════════════════════════════════════════════════════════════
    // Task Creation
    // ════════════════════════════════════════════════════════════════════

    function test_create_paidTaskLocksEscrow() public {
        uint32 maxWorkers = 3;
        uint256 gross     = BOUNTY * maxWorkers;
        uint256 fee       = (gross * FEE_BPS) / 10_000;

        uint256 posterBefore = token.balanceOf(poster);
        uint256 taskId       = _createPaid(BOUNTY, maxWorkers);
        uint256 posterAfter  = token.balanceOf(poster);

        assertEq(posterBefore - posterAfter, gross + fee);
        TaskEscrow.Task memory t = escrow.getTask(taskId);
        assertTrue(t.isPaid);
        assertEq(t.totalEscrowed, gross);
        assertEq(uint8(t.status), uint8(TaskEscrow.TaskStatus.Open));
    }

    function test_create_unpaidTaskZeroEscrow() public {
        uint256 taskId = _createUnpaid(5);
        TaskEscrow.Task memory t = escrow.getTask(taskId);
        assertFalse(t.isPaid);
        assertEq(t.totalEscrowed, 0);
    }

    function test_create_storesVerificationMethod() public {
        uint64 deadline = uint64(block.timestamp + ONE_DAY);
        vm.prank(poster);
        uint256 taskId = escrow.createTask(TaskEscrow.TaskParams({
            title: "T", description: "D", category: "C",
            bountyPerWorker: BOUNTY, paymentToken: address(token),
            maxWorkers: 1, deadline: deadline,
            verificationMethod: TaskEscrow.VerificationMethod.GoogleForm,
            verificationRef: "https://forms.gle/abc"
        }));
        TaskEscrow.Task memory t = escrow.getTask(taskId);
        assertEq(uint8(t.verificationMethod), uint8(TaskEscrow.VerificationMethod.GoogleForm));
        assertEq(t.verificationRef, "https://forms.gle/abc");
    }

    function test_create_revertsDeadlineInPast() public {
        uint64 deadline = uint64(block.timestamp - 1);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.DeadlineMustBeFuture.selector));
        escrow.createTask(_paidParams(BOUNTY, 1, deadline));
    }

    function test_create_revertsZeroMaxWorkers() public {
        uint64 deadline = uint64(block.timestamp + ONE_DAY);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.MaxWorkersMustBePositive.selector));
        escrow.createTask(_paidParams(BOUNTY, 0, deadline));
    }

    // ════════════════════════════════════════════════════════════════════
    // Worker Flow
    // ════════════════════════════════════════════════════════════════════

    function test_worker_unverifiedCannotJoin() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.WorkerNotVerified.selector));
        escrow.joinTask(taskId);
    }

    function test_worker_joinMovesToInProgressWhenFull() public {
        uint256 taskId = _createPaid(BOUNTY, 2);

        _join(worker1, taskId);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Open));

        _join(worker2, taskId);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.InProgress));
    }

    function test_worker_cannotJoinFullTask() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        _join(worker1, taskId);
        _join(worker2, taskId);

        vm.prank(worker3);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskFull.selector));
        escrow.joinTask(taskId);
    }

    function test_worker_cannotJoinTwice() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        _join(worker1, taskId);

        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.AlreadyJoined.selector));
        escrow.joinTask(taskId);
    }

    function test_worker_approvalSendsBountyAndCompletes() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "ipfs://Qm...");

        uint256 before = token.balanceOf(worker1);
        _approve(taskId, worker1);
        uint256 afterBal = token.balanceOf(worker1);

        assertEq(afterBal - before, BOUNTY);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Completed));
    }

    function test_worker_rejectionFreesSlotAndReopens() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "bad proof");
        _reject(taskId, worker1);

        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Open));
        assertFalse(escrow.hasJoined(taskId, worker1));

        // Another worker can now join
        _join(worker3, taskId);
        assertTrue(escrow.hasJoined(taskId, worker3));
    }

    function test_worker_cannotSubmitWithoutJoining() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotJoined.selector));
        escrow.submitProof(taskId, "proof");
    }

    function test_worker_cannotSubmitAfterDeadline() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);

        vm.warp(block.timestamp + ONE_DAY + 1);

        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskExpired.selector));
        escrow.submitProof(taskId, "late proof");
    }

    function test_worker_cannotJoinAfterDeadline() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.warp(block.timestamp + ONE_DAY + 1);

        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskExpired.selector));
        escrow.joinTask(taskId);
    }

    // ════════════════════════════════════════════════════════════════════
    // Unpaid Task Flow
    // ════════════════════════════════════════════════════════════════════

    function test_unpaid_completesWithoutTokenTransfer() public {
        uint256 taskId  = _createUnpaid(3);
        uint256 before  = token.balanceOf(worker1);

        _join(worker1, taskId);
        _submit(worker1, taskId, "volunteer proof");
        _approve(taskId, worker1);

        assertEq(token.balanceOf(worker1), before);
        WorkerReputation.WorkerStats memory ws = reputation.getStats(worker1);
        uint256 completed = ws.tasksCompleted;
        assertEq(completed, 1);
    }

    // ════════════════════════════════════════════════════════════════════
    // Cancellation
    // ════════════════════════════════════════════════════════════════════

    function test_cancel_refundsUnusedEscrow() public {
        uint256 taskId = _createPaid(BOUNTY, 3);
        _join(worker1, taskId);
        _submit(worker1, taskId, "ok");
        _approve(taskId, worker1);

        // 1 approved (paid out), 2 slots remaining in escrow
        uint256 posterBefore = token.balanceOf(poster);
        vm.prank(poster);
        escrow.cancelTask(taskId);

        assertEq(token.balanceOf(poster) - posterBefore, BOUNTY * 2);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Cancelled));
    }

    function test_cancel_nonPosterReverts() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotPoster.selector));
        escrow.cancelTask(taskId);
    }

    // ════════════════════════════════════════════════════════════════════
    // Extend Deadline
    // ════════════════════════════════════════════════════════════════════

    function test_extend_statusBecomesExtended() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        uint64  before = escrow.getTask(taskId).deadline;

        vm.prank(poster);
        escrow.extendDeadline(taskId, uint64(ONE_DAY));

        TaskEscrow.Task memory t = escrow.getTask(taskId);
        assertEq(uint8(t.status), uint8(TaskEscrow.TaskStatus.Extended));
        assertEq(t.deadline, before + uint64(ONE_DAY));
        assertEq(t.extensionCount, 1);
    }

    function test_extend_countIncrementsEachTime() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.startPrank(poster);
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
        vm.stopPrank();
        assertEq(escrow.getTask(taskId).extensionCount, 2);
    }

    function test_extend_revertsOnFourthExtension() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.startPrank(poster);
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.MaxExtensionsReached.selector));
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
        vm.stopPrank();
    }

    function test_extend_revertsIfTooShort() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.ExtensionTooShort.selector));
        escrow.extendDeadline(taskId, uint64(ONE_HOUR - 1));
    }

    function test_extend_revertsIfTooLong() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.ExtensionTooLong.selector));
        escrow.extendDeadline(taskId, uint64(31 * ONE_DAY));
    }

    function test_extend_canReopenPastTask() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.warp(block.timestamp + ONE_DAY + 1);

        // Status should be Past
        assertEq(
            uint8(escrow.getTaskStatus(taskId)),
            uint8(TaskEscrow.TaskStatus.Past)
        );

        vm.prank(poster);
        escrow.extendDeadline(taskId, uint64(ONE_WEEK));

        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Extended));
    }

    function test_extend_nonPosterReverts() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotPoster.selector));
        escrow.extendDeadline(taskId, uint64(ONE_DAY));
    }

    function test_extend_workersCanJoinExtendedTask() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(poster);
        escrow.extendDeadline(taskId, uint64(ONE_DAY));

        _join(worker1, taskId);
        assertTrue(escrow.hasJoined(taskId, worker1));
    }

    // ════════════════════════════════════════════════════════════════════
    // Past Tasks & Partial Refunds
    // ════════════════════════════════════════════════════════════════════

    function test_past_getTaskStatusReportsPastAfterDeadline() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.warp(block.timestamp + ONE_DAY + 1);
        assertEq(
            uint8(escrow.getTaskStatus(taskId)),
            uint8(TaskEscrow.TaskStatus.Past)
        );
    }

    function test_past_settlePastTaskRefundsFullEscrow() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 posterBefore = token.balanceOf(poster);
        escrow.settlePastTask(taskId);

        assertEq(token.balanceOf(poster) - posterBefore, BOUNTY * 2);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Past));
    }

    function test_past_partialFillRefundsRemainingOnSettlement() public {
        uint256 taskId = _createPaid(BOUNTY, 3);

        // 1 worker approved, 2 slots unfilled
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");
        _approve(taskId, worker1);

        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 posterBefore = token.balanceOf(poster);
        escrow.settlePastTask(taskId);

        // 2 unapproved slots refunded
        assertEq(token.balanceOf(poster) - posterBefore, BOUNTY * 2);
    }

    function test_past_settlePastRevertsBeforeDeadline() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskNotOpen.selector));
        escrow.settlePastTask(taskId);
    }

    function test_past_zeroWorkersPaidTaskRefundsEverything() public {
        uint256 taskId = _createPaid(BOUNTY, 5);
        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 posterBefore = token.balanceOf(poster);
        escrow.settlePastTask(taskId);

        assertEq(token.balanceOf(poster) - posterBefore, BOUNTY * 5);
    }

    // ════════════════════════════════════════════════════════════════════
    // Close Task
    // ════════════════════════════════════════════════════════════════════

    function test_close_completedTaskStatusClosed() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");
        _approve(taskId, worker1);

        vm.prank(poster);
        escrow.closeTask(taskId);

        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Closed));
    }

    function test_close_pastTaskRefundsAndCloses() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 posterBefore = token.balanceOf(poster);
        vm.prank(poster);
        escrow.closeTask(taskId);

        assertEq(token.balanceOf(poster) - posterBefore, BOUNTY * 2);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Closed));
    }

    function test_close_activeTaskReverts() public {
        uint256 taskId = _createPaid(BOUNTY, 2);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskNotCloseable.selector));
        escrow.closeTask(taskId);
    }

    function test_close_alreadyClosedReverts() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");
        _approve(taskId, worker1);

        vm.startPrank(poster);
        escrow.closeTask(taskId);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskAlreadyClosed.selector));
        escrow.closeTask(taskId);
        vm.stopPrank();
    }

    // ════════════════════════════════════════════════════════════════════
    // Arbitration
    // ════════════════════════════════════════════════════════════════════

    function test_dispute_revertsWhenArbitrationNotSet() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");

        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.ArbitrationNotSet.selector));
        escrow.raiseDispute(taskId, worker1);
    }

    // ════════════════════════════════════════════════════════════════════
    // Platform Fees
    // ════════════════════════════════════════════════════════════════════

    function test_fees_collectedOnTaskCreation() public {
        uint32  maxWorkers  = 4;
        uint256 gross       = BOUNTY * maxWorkers;
        uint256 expectedFee = (gross * FEE_BPS) / 10_000;

        _createPaid(BOUNTY, maxWorkers);

        assertEq(escrow.feesCollected(address(token)), expectedFee);
    }

    function test_fees_ownerCanWithdraw() public {
        uint32  maxWorkers  = 4;
        uint256 gross       = BOUNTY * maxWorkers;
        uint256 expectedFee = (gross * FEE_BPS) / 10_000;

        _createPaid(BOUNTY, maxWorkers);

        uint256 ownerBefore = token.balanceOf(owner);
        vm.prank(owner);
        escrow.withdrawFees(address(token));

        assertEq(token.balanceOf(owner) - ownerBefore, expectedFee);
        assertEq(escrow.feesCollected(address(token)), 0);
    }

    function test_fees_nonOwnerCannotWithdraw() public {
        _createPaid(BOUNTY, 2);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotOwner.selector));
        escrow.withdrawFees(address(token));
    }

    // ════════════════════════════════════════════════════════════════════
    // Admin
    // ════════════════════════════════════════════════════════════════════

    function test_admin_onlyOwnerCanSetVerifier() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotOwner.selector));
        escrow.setVerifier(stranger);
    }

    function test_admin_onlyOwnerCanSetFee() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotOwner.selector));
        escrow.setPlatformFee(100);
    }

    function test_admin_feeCannotExceed10Percent() public {
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        escrow.setPlatformFee(1001);
    }

    function test_admin_onlyVerifierCanVerifyWorker() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.NotVerifier.selector));
        escrow.setWorkerVerified(stranger);
    }
}
