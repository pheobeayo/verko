// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function symbol() external view returns (string memory);
}

interface ITaskEscrow {
    struct TaskParams {
        string  title;
        string  description;
        string  category;
        uint256 bountyPerWorker;
        address paymentToken;
        uint32  maxWorkers;
        uint64  deadline;
        uint8   verificationMethod;
        string  verificationRef;
    }
    function createTask(TaskParams calldata p) external returns (uint256);
    function taskCount() external view returns (uint256);
    function platformFeeBps() external view returns (uint16);
}

contract CreateTasks is Script {

    // deployed addresses
    address constant TASK_ESCROW = 0xe53A148e1ea1933b3e6fdA2a590Bb375956267C7;
    address constant MOCK_TOKEN  = 0x2Ef7d311d08bf6C9990c46D07c86eb3c9ADd7Cb3;

    // VerificationMethod enum values
    uint8 constant OnChainText = 0;
    uint8 constant GoogleForm  = 1;
    uint8 constant Email       = 2;
    uint8 constant SocialPost  = 3;
    uint8 constant Custom      = 4;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        IERC20      token  = IERC20(MOCK_TOKEN);
        ITaskEscrow escrow = ITaskEscrow(TASK_ESCROW);

        uint16 feeBps = escrow.platformFeeBps();

        console.log("==============================================");
        console.log("Verko - Create Test Tasks");
        console.log("==============================================");
        console.log("Deployer:  ", deployer);
        console.log("Escrow:    ", TASK_ESCROW);
        console.log("MockToken: ", MOCK_TOKEN);
        console.log("Symbol:    ", token.symbol());
        console.log("Balance:   ", token.balanceOf(deployer) / 1e18, "mG$");
        console.log("Fee:       ", feeBps / 100, "%");
        console.log("----------------------------------------------");

        // ── 2 tasks only ─────────────────────────────────────────────────
        ITaskEscrow.TaskParams[] memory tasks = new ITaskEscrow.TaskParams[](2);

        tasks[0] = ITaskEscrow.TaskParams({
            title:              "Photograph First Bank Branch - Broad Street Lagos",
            description:        "Visit the First Bank branch on Broad Street, Lagos Island. Take 3 clear photos: (1) exterior signage, (2) entrance, (3) operational hours board. Confirm the branch is open. GPS metadata must be enabled on your phone camera.",
            category:           "Photo Verification",
            bountyPerWorker:    25 ether,
            paymentToken:       MOCK_TOKEN,
            maxWorkers:         5,
            deadline:           uint64(block.timestamp + 3 days),
            verificationMethod: GoogleForm,
            verificationRef:    "https://forms.gle/testVerko001"
        });

        tasks[1] = ITaskEscrow.TaskParams({
            title:              "Share GoodDollar Awareness Post in Community Groups",
            description:        "Share the GoodDollar introduction message in at least 3 WhatsApp or Telegram community groups. Screenshot each share and paste the confirmation text as your proof. Volunteer task.",
            category:           "Community Outreach",
            bountyPerWorker:    0,
            paymentToken:       address(0),
            maxWorkers:         20,
            deadline:           uint64(block.timestamp + 4 days),
            verificationMethod: OnChainText,
            verificationRef:    ""
        });

        // Calculate total needed 
        uint256 totalNeeded = 0;
        for (uint i = 0; i < tasks.length; i++) {
            if (tasks[i].bountyPerWorker > 0) {
                uint256 gross = tasks[i].bountyPerWorker * tasks[i].maxWorkers;
                uint256 fee   = (gross * feeBps) / 10000;
                totalNeeded  += gross + fee;
            }
        }

        console.log("Total mG$ needed:", totalNeeded / 1e18);
        require(
            token.balanceOf(deployer) >= totalNeeded,
            "Insufficient mG$ balance"
        );

        vm.startBroadcast(deployerKey);

        // Approve escrow 
        uint256 currentAllowance = token.allowance(deployer, TASK_ESCROW);
        if (currentAllowance < totalNeeded) {
            token.approve(TASK_ESCROW, totalNeeded);
            console.log("Approved:", totalNeeded / 1e18, "mG$");
        } else {
            console.log("Allowance already sufficient");
        }

        // Create tasks
        uint256 tasksBefore = escrow.taskCount();

        for (uint i = 0; i < tasks.length; i++) {
            uint256 taskId = escrow.createTask(tasks[i]);
            bool isPaid = tasks[i].bountyPerWorker > 0;

            console.log("----------------------------------------------");
            console.log("Task #", taskId, "created");
            console.log("Title:", tasks[i].title);
            if (isPaid) {
                uint256 gross = tasks[i].bountyPerWorker * tasks[i].maxWorkers;
                console.log("Escrowed:", gross / 1e18, "mG$");
            } else {
                console.log("Volunteer task - no escrow");
            }
        }

        vm.stopBroadcast();

        // Summary 
        uint256 tasksAfter = escrow.taskCount();
        console.log("==============================================");
        console.log("Done!", tasksAfter - tasksBefore, "tasks created");
        console.log("Total tasks on chain:", tasksAfter);
        console.log("Remaining balance:", token.balanceOf(deployer) / 1e18, "mG$");
        console.log("==============================================");
        console.log("View on Blockscout:");
        console.log("https://celo-sepolia.blockscout.com/address/", TASK_ESCROW);
    }
}
