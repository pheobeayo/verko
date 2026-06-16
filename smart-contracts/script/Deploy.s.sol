// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";


import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/WorkerReputation.sol";
import "../src/TaskEscrow.sol";


contract Deploy is Script {

    // Celo Mainnet addresses 
    address constant GD_IDENTITY  = 0xC361A6E67822a0EDc17D899227dd9FC50BD62F42;
    address constant GOOD_DOLLAR  = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

    function run() external {
        uint256 deployerKey = vm.envUint("MAINNET_PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);
        uint16  feeBps      = uint16(vm.envOr("PLATFORM_FEE_BPS", uint256(600)));

        console.log("==============================================");
        console.log("Verko - Upgradeable Deploy (Celo Mainnet)");
        console.log("==============================================");
        console.log("Deployer:    ", deployer);
        console.log("Fee bps:     ", feeBps);
        console.log("GD Identity: ", GD_IDENTITY);
        console.log("G$ Token:    ", GOOD_DOLLAR);
        console.log("----------------------------------------------");

        vm.startBroadcast(deployerKey);

        // 1. Deploy WorkerReputation implementation 
        WorkerReputation repImpl = new WorkerReputation();
        console.log("WorkerReputation impl:  ", address(repImpl));

        // 2. Deploy WorkerReputation proxy 
        bytes memory repInit = abi.encodeCall(
            WorkerReputation.initialize,
            (deployer)
        );
        ERC1967Proxy repProxy = new ERC1967Proxy(address(repImpl), repInit);
        console.log("WorkerReputation proxy: ", address(repProxy));

        // 3. Deploy TaskEscrow implementation 
        TaskEscrow escrowImpl = new TaskEscrow();
        console.log("TaskEscrow impl:        ", address(escrowImpl));

        // 4. Deploy TaskEscrow proxy 
        bytes memory escrowInit = abi.encodeCall(
            TaskEscrow.initialize,
            (
                address(repProxy),  // _reputation
                GD_IDENTITY,        // _gdIdentity
                feeBps,             // _platformFeeBps
                deployer            // initialOwner
            )
        );
        ERC1967Proxy escrowProxy = new ERC1967Proxy(address(escrowImpl), escrowInit);
        console.log("TaskEscrow proxy:       ", address(escrowProxy));

        // 5. Wire WorkerReputation → TaskEscrow 
        WorkerReputation(address(repProxy)).setEscrow(address(escrowProxy));
        console.log("reputation.setEscrow() done");

        vm.stopBroadcast();

        console.log("==============================================");
        console.log("Deployment complete!");
        console.log("==============================================");
        console.log("");
        console.log("Copy these to your frontend .env:");
        console.log("----------------------------------------------");
        console.log("NEXT_PUBLIC_ESCROW_ADDRESS   =", address(escrowProxy));
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS =", address(repProxy));
        console.log("NEXT_PUBLIC_PAYMENT_TOKEN    =", GOOD_DOLLAR);
        console.log("----------------------------------------------");
        console.log("");
        console.log("Verify on Celoscan:");
        console.log("https://celoscan.io/address/", address(escrowProxy));
        console.log("https://celoscan.io/address/", address(repProxy));
        console.log("==============================================");
    }
}
