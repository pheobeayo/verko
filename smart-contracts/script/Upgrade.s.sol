// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/WorkerReputation.sol";
import "../src/TaskEscrow.sol";

contract Upgrade is Script {

    function run() external {
        uint256 deployerKey = vm.envUint("MAINNET_PRIVATE_KEY");

        bool upgradeEscrow     = vm.envOr("UPGRADE_ESCROW",     false);
        bool upgradeReputation = vm.envOr("UPGRADE_REPUTATION", false);

        require(upgradeEscrow || upgradeReputation, "Nothing to upgrade");

        vm.startBroadcast(deployerKey);

        if (upgradeEscrow) {
            address escrowProxy = vm.envAddress("ESCROW_PROXY");

            // Deploy new implementation
            TaskEscrow newImpl = new TaskEscrow();
            console.log("New TaskEscrow impl:", address(newImpl));

            // Upgrade — no re-initialisation needed for pure logic upgrades.
            // If new storage variables are added, call upgradeToAndCall() with
            // a migration calldata instead.
            TaskEscrow(escrowProxy).upgradeToAndCall(address(newImpl), "");
            console.log("TaskEscrow proxy upgraded:", escrowProxy);
        }

        if (upgradeReputation) {
            address repProxy = vm.envAddress("REPUTATION_PROXY");

            WorkerReputation newImpl = new WorkerReputation();
            console.log("New WorkerReputation impl:", address(newImpl));

            WorkerReputation(repProxy).upgradeToAndCall(address(newImpl), "");
            console.log("WorkerReputation proxy upgraded:", repProxy);
        }

        vm.stopBroadcast();
        console.log("Upgrade complete.");
    }
}
