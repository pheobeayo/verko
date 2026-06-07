// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/WorkerReputation.sol";
import "../src/TaskEscrow.sol";

contract Deploy is Script {

    // 6% platform fee (600 basis points)
    uint16 constant PLATFORM_FEE_BPS = 600;

    // Real GoodDollar G$ token on Celo mainnet
    address constant GOOD_DOLLAR = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

    function run() external {
        uint256 deployerKey = vm.envUint("MAINNET_PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        console.log("==============================================");
        console.log("Verko - Deploy Contracts (Celo Mainnet)");
        console.log("==============================================");
        console.log("Deployer:   ", deployer);
        console.log("Network:     Celo Mainnet (chain 42220)");
        console.log("Fee:        ", PLATFORM_FEE_BPS / 100, "%");
        console.log("G$ Token:   ", GOOD_DOLLAR);
        console.log("----------------------------------------------");

        vm.startBroadcast(deployerKey);

        // 1. Deploy WorkerReputation (soul-bound NFT)
        WorkerReputation reputation = new WorkerReputation();
        console.log("WorkerReputation deployed:", address(reputation));

        // 2. Deploy TaskEscrow
        TaskEscrow escrow = new TaskEscrow(
            address(reputation),
            deployer,
            PLATFORM_FEE_BPS
        );
        console.log("TaskEscrow deployed:      ", address(escrow));

        // 3. Wire reputation → escrow
        reputation.setEscrow(address(escrow));
        console.log("reputation.setEscrow() done");

        vm.stopBroadcast();

        // Summary
        console.log("==============================================");
        console.log("Deployment complete!");
        console.log("==============================================");
        console.log("");
        console.log("Copy these into your frontend .env:");
        console.log("----------------------------------------------");
        console.log("NEXT_PUBLIC_ESCROW_ADDRESS    =", address(escrow));
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS  =", address(reputation));
        console.log("NEXT_PUBLIC_PAYMENT_TOKEN     =", GOOD_DOLLAR);
        console.log("----------------------------------------------");
        console.log("");
        console.log("Verify on Celoscan:");
        console.log("https://celoscan.io/address/", address(escrow));
        console.log("https://celoscan.io/address/", address(reputation));
        console.log("==============================================");
    }
}
