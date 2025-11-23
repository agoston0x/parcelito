// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ParcelitoENS.sol";

contract ParcelitoENSTest is Test {
    ParcelitoENS public ens;
    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        ens = new ParcelitoENS("parcelitos.eth");
    }

    function test_Register() public {
        vm.prank(alice);
        uint256 tokenId = ens.register("agoston.6256", alice);

        assertEq(ens.ownerOf(tokenId), alice);
        assertEq(ens.labels(tokenId), "agoston.6256");
        assertEq(ens.fullName(tokenId), "agoston.6256.parcelitos.eth");
        assertTrue(ens.registered("agoston.6256"));
    }

    function test_SetText() public {
        vm.startPrank(alice);
        uint256 tokenId = ens.register("agoston.6256", alice);

        string memory claims = '{"type":"Layer 1s","amount":100}';
        ens.setText(tokenId, "parcelito.claims", claims);

        assertEq(ens.text(tokenId, "parcelito.claims"), claims);
        vm.stopPrank();
    }

    function test_CannotRegisterTwice() public {
        ens.register("agoston.6256", alice);

        vm.expectRevert(ParcelitoENS.AlreadyRegistered.selector);
        ens.register("agoston.6256", bob);
    }

    function test_OnlyOwnerCanSetText() public {
        uint256 tokenId = ens.register("agoston.6256", alice);

        vm.prank(bob);
        vm.expectRevert(ParcelitoENS.NotOwner.selector);
        ens.setText(tokenId, "parcelito.claims", "hack");
    }

    function test_GetTokenId() public view {
        uint256 expected = uint256(keccak256(bytes("agoston.6256")));
        assertEq(ens.getTokenId("agoston.6256"), expected);
    }

    function test_Available() public {
        assertTrue(ens.available("new.user"));
        ens.register("new.user", alice);
        assertFalse(ens.available("new.user"));
    }
}
