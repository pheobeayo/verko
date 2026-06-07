// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";

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
}

contract CreateMainnetTask is Script {

    // Mainnet deployed addresses
    address constant TASK_ESCROW = 0xB4429d77543A6909449a48CAB1903f909d32d44C;

    // VerificationMethod enum values
    uint8 constant OnChainText = 0;
    uint8 constant GoogleForm  = 1;
    uint8 constant Email       = 2;
    uint8 constant SocialPost  = 3;
    uint8 constant Custom      = 4;

    function run() external {
        uint256 deployerKey = vm.envUint("MAINNET_PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        ITaskEscrow escrow = ITaskEscrow(TASK_ESCROW);

        console.log("==============================================");
        console.log("Verko - Create Mainnet Volunteer Task");
        console.log("==============================================");
        console.log("Deployer: ", deployer);
        console.log("Escrow:   ", TASK_ESCROW);
        console.log("Network:   Celo Mainnet (chain 42220)");
        console.log("----------------------------------------------");

        vm.startBroadcast(deployerKey);

        uint256 taskId = escrow.createTask(ITaskEscrow.TaskParams({
            title:              "GoodDollar UBI Research Survey",
            description:        "Help us understand how people use GoodDollar UBI in their daily lives. Complete this short research survey (5-7 minutes): (1) How long have you been claiming G$? (2) What do you use G$ for? (3) Has GoodDollar UBI impacted your financial situation? (4) What improvements would you suggest? Submit your answers directly as your proof on-chain. Be honest and specific - vague answers will be rejected.",
            category:           "Surveys & Research",
            bountyPerWorker:    0,               // volunteer — no payment
            paymentToken:       address(0),      // address(0) for volunteer
            maxWorkers:         10,
            deadline:           uint64(block.timestamp + 7 days),
            verificationMethod: OnChainText,     // workers submit text directly
            verificationRef:    ""
        }));

        vm.stopBroadcast();

        console.log("==============================================");
        console.log("Volunteer task created!");
        console.log("Task ID:", taskId);
        console.log("Total tasks on chain:", escrow.taskCount());
        console.log("----------------------------------------------");
        console.log("View on Celoscan:");
        console.log("https://celoscan.io/address/", TASK_ESCROW);
        console.log("==============================================");
    }
}
