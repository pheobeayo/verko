// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TaskEscrow.sol";


contract CreateTask is Script {

    address constant ESCROW   = 0xd72F43Ee820408daBa4D385EEFB267eB0e5C84Ee;
    address constant GD_TOKEN = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

    function run() external {
        uint256 posterKey       = vm.envUint("MAINNET_PRIVATE_KEY");
        address poster          = vm.addr(posterKey);
        bool    isPaid          = vm.envOr("PAID", false);
        uint256 bountyPerWorker = vm.envOr("BOUNTY_PER_WORKER", uint256(1e18));
        uint32  maxWorkers      = uint32(vm.envOr("MAX_WORKERS", uint256(3)));
        uint256 deadlineDays    = vm.envOr("DEADLINE_DAYS", uint256(7));
        uint64  deadline        = uint64(block.timestamp + deadlineDays * 1 days);

        console.log("==============================================");
        console.log("Verko - Create Task (Celo Mainnet)");
        console.log("==============================================");
        console.log("Poster:         ", poster);
        console.log("Paid task:      ", isPaid ? "yes" : "no");
        console.log("Max workers:    ", maxWorkers);
        console.log("Deadline days:  ", deadlineDays);

        vm.startBroadcast(posterKey);

        if (isPaid) {
            uint256 gross = bountyPerWorker * maxWorkers;
            uint256 fee   = (gross * 600) / 10000;
            uint256 total = gross + fee;

            console.log("Bounty/worker:  ", bountyPerWorker);
            console.log("Total G$ cost:  ", total);

            (bool ok, ) = GD_TOKEN.call(
                abi.encodeWithSignature(
                    "approve(address,uint256)",
                    ESCROW,
                    total
                )
            );
            require(ok, "G$ approval failed");
            console.log("G$ approved successfully");
        }

        TaskEscrow.TaskParams memory params = TaskEscrow.TaskParams({
            title:              "Your Task Title Here",
            description:        "Describe what workers need to do clearly and concisely.",
            category:           "Survey",
            bountyPerWorker:    isPaid ? bountyPerWorker : 0,
            paymentToken:       isPaid ? GD_TOKEN : address(0),
            maxWorkers:         maxWorkers,
            deadline:           deadline,
            verificationMethod: TaskEscrow.VerificationMethod.OnChainText,
            verificationRef:    ""
        });

        uint256 taskId = TaskEscrow(ESCROW).createTask(params);

        vm.stopBroadcast();

        console.log("==============================================");
        console.log("Task created! ID:", taskId);
        console.log("https://celoscan.io/address/", ESCROW);
        console.log("==============================================");
    }
}
