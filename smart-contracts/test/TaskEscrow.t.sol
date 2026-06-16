// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TaskEscrow.sol";
import "../src/WorkerReputation.sol";
import "../src/MockERC20.sol";

contract TaskEscrowTest is Test {

    // Constants
    uint16  constant FEE_BPS      = 600;
    uint256 constant ONE_DAY      = 86400;
    uint256 constant ONE_HOUR     = 3600;
    uint256 constant ONE_WEEK     = 7 * ONE_DAY;
    uint256 constant BOUNTY       = 100 ether;
    uint256 constant TOKEN_SUPPLY = 1000000 ether;

    // Contracts (proxies)
    TaskEscrow       escrow;
    WorkerReputation reputation;
    MockERC20        token;

    // Actors
    address owner    = makeAddr("owner");
    address poster   = makeAddr("poster");
    address worker1  = makeAddr("worker1");
    address worker2  = makeAddr("worker2");
    address worker3  = makeAddr("worker3");
    address stranger = makeAddr("stranger");

    // Fake GoodDollar identity address — we mock isWhitelisted() on it
    address constant GD_IDENTITY_MOCK = address(0xBEEF);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy token
        token = new MockERC20(TOKEN_SUPPLY);

        // Deploy WorkerReputation behind a UUPS proxy
        WorkerReputation repImpl = new WorkerReputation();
        bytes memory repInit = abi.encodeCall(WorkerReputation.initialize, (owner));
        ERC1967Proxy repProxy = new ERC1967Proxy(address(repImpl), repInit);
        reputation = WorkerReputation(address(repProxy));

        // Deploy TaskEscrow behind a UUPS proxy
        // Use GD_IDENTITY_MOCK so we can mock isWhitelisted() per-test
        TaskEscrow escrowImpl = new TaskEscrow();
        bytes memory escrowInit = abi.encodeCall(
            TaskEscrow.initialize,
            (address(reputation), GD_IDENTITY_MOCK, FEE_BPS, owner)
        );
        ERC1967Proxy escrowProxy = new ERC1967Proxy(address(escrowImpl), escrowInit);
        escrow = TaskEscrow(address(escrowProxy));

        // Wire reputation -> escrow
        reputation.setEscrow(address(escrow));

        // Fund poster
        token.transfer(poster, 50000 ether);

        vm.stopPrank();

        // Approve escrow from poster
        vm.prank(poster);
        token.approve(address(escrow), 50000 ether);

        // Mock GoodDollar identity: worker1, worker2, worker3 are verified
        // stranger is NOT verified
        vm.mockCall(
            GD_IDENTITY_MOCK,
            abi.encodeWithSignature("isWhitelisted(address)", worker1),
            abi.encode(true)
        );
        vm.mockCall(
            GD_IDENTITY_MOCK,
            abi.encodeWithSignature("isWhitelisted(address)", worker2),
            abi.encode(true)
        );
        vm.mockCall(
            GD_IDENTITY_MOCK,
            abi.encodeWithSignature("isWhitelisted(address)", worker3),
            abi.encode(true)
        );
        vm.mockCall(
            GD_IDENTITY_MOCK,
            abi.encodeWithSignature("isWhitelisted(address)", stranger),
            abi.encode(false)
        );
    }

    // Helpers

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

    // WorkerReputation tests

    function test_reputation_initialState() public view {
        WorkerReputation.WorkerStats memory s = reputation.getStats(worker1);
        assertEq(s.tasksCompleted, 0);
        assertEq(s.tier, 0);
        assertEq(s.tokenId, 0);
    }

    function test_reputation_onlyEscrowCanRecord() public {
        vm.expectRevert(abi.encodeWithSelector(WorkerReputation.NotEscrow.selector));
        reputation.recordCompletion(worker1, 1, true, 0);
    }

    function test_reputation_mintsSoulboundNFTOnFirstApproval() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");
        _approve(taskId, worker1);

        WorkerReputation.WorkerStats memory s = reputation.getStats(worker1);
        assertEq(s.tasksCompleted, 1);
        assertGt(s.tokenId, 0);
        assertEq(reputation.ownerOf(s.tokenId), worker1);
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

    // Task Creation tests

    function test_create_paidTaskLocksEscrow() public {
        uint32 maxWorkers = 3;
        uint256 gross     = BOUNTY * maxWorkers;
        uint256 fee       = (gross * FEE_BPS) / 10000;

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

    // Worker Flow tests

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

    // Auto-approval test (new fix)

    function test_autoApproval_workerCanClaimAfterTimeout() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");

        // Warp past approval timeout (7 days)
        vm.warp(block.timestamp + 7 days + 1);

        uint256 before = token.balanceOf(worker1);
        vm.prank(worker1);
        escrow.claimAutoApproval(taskId);

        assertEq(token.balanceOf(worker1) - before, BOUNTY);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Completed));
    }

    function test_autoApproval_revertsBeforeTimeout() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");

        vm.prank(worker1);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.ApprovalTimeoutNotReached.selector));
        escrow.claimAutoApproval(taskId);
    }

    // Unpaid Task Flow tests

    function test_unpaid_completesWithoutTokenTransfer() public {
        uint256 taskId  = _createUnpaid(3);
        uint256 before  = token.balanceOf(worker1);

        _join(worker1, taskId);
        _submit(worker1, taskId, "volunteer proof");
        _approve(taskId, worker1);

        assertEq(token.balanceOf(worker1), before);
        WorkerReputation.WorkerStats memory ws = reputation.getStats(worker1);
        assertEq(ws.tasksCompleted, 1);
    }

    // Cancellation tests

    function test_cancel_refundsUnusedEscrow() public {
        uint256 taskId = _createPaid(BOUNTY, 3);
        _join(worker1, taskId);
        _submit(worker1, taskId, "ok");
        _approve(taskId, worker1);

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

    // Extend Deadline tests

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

    // Past Tasks & Partial Refunds tests

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

        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");
        _approve(taskId, worker1);

        vm.warp(block.timestamp + ONE_DAY + 1);

        uint256 posterBefore = token.balanceOf(poster);
        escrow.settlePastTask(taskId);

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

    // Close Task tests

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

    // Arbitration tests

    function test_dispute_revertsWhenArbitrationNotSet() public {
        uint256 taskId = _createPaid(BOUNTY, 1);
        _join(worker1, taskId);
        _submit(worker1, taskId, "proof");

        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.ArbitrationNotSet.selector));
        escrow.raiseDispute(taskId, worker1);
    }

    // Platform Fee tests

    function test_fees_collectedOnTaskCreation() public {
        uint32  maxWorkers  = 4;
        uint256 gross       = BOUNTY * maxWorkers;
        uint256 expectedFee = (gross * FEE_BPS) / 10000;

        _createPaid(BOUNTY, maxWorkers);

        assertEq(escrow.feesCollected(address(token)), expectedFee);
    }

    function test_fees_ownerCanWithdraw() public {
        uint32  maxWorkers  = 4;
        uint256 gross       = BOUNTY * maxWorkers;
        uint256 expectedFee = (gross * FEE_BPS) / 10000;

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
        // OwnableUpgradeable uses "Ownable: caller is not the owner"
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.withdrawFees(address(token));
    }

    // Admin tests

    function test_admin_onlyOwnerCanSetFee() public {
        vm.prank(stranger);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.setPlatformFee(100);
    }

    function test_admin_feeCannotExceed10Percent() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.FeeTooHigh.selector));
        escrow.setPlatformFee(1001);
    }

    // GD Identity timelock tests (new fix)

    function test_gdIdentity_timelockEnforced() public {
        address newIdentity = makeAddr("newIdentity");

        vm.prank(owner);
        escrow.proposeGDIdentity(newIdentity);

        // Cannot accept before 2 days
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TimelockNotExpired.selector));
        escrow.acceptGDIdentity();

        // Warp past timelock
        vm.warp(block.timestamp + 2 days + 1);

        vm.prank(owner);
        escrow.acceptGDIdentity();

        assertEq(escrow.gdIdentity(), newIdentity);
    }

    function test_gdIdentity_nonOwnerCannotPropose() public {
        vm.prank(stranger);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.proposeGDIdentity(makeAddr("x"));
    }
}
