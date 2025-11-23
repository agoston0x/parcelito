// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ParcelitoENS.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Set your ENS domain name here (parcelito.eth or parcelitos.eth)
        string memory baseDomain = vm.envOr("BASE_DOMAIN", string("parcelitos.eth"));

        console.log("Deploying ParcelitoENS for:", baseDomain);

        vm.startBroadcast(deployerPrivateKey);

        ParcelitoENS ens = new ParcelitoENS(baseDomain);

        console.log("ParcelitoENS deployed at:", address(ens));
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Update contract address in src/hooks/useBuyParcelito.ts");
        console.log("2. Whitelist this address in World Developer Portal");

        vm.stopBroadcast();
    }
}
