// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    uint256 private BASIC_COST = 0.0001 ether;

    uint256 private tokenIdCounter;

    string private constant BASE_URI =
        "ipfs://bafkreiehkbbvbl2bb7rgu7zevqdrtx6rkb4pxhalxtwxkiphiatvpggxmi";

    error NotEnoughMoney(uint256 sentAmount, uint256 nftCost);
    error TransferError(address to, uint256 amount);

    event Minted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 price,
        string tokenURI,
        uint256 indexed timeStamp
    );
    event BasicCostChanged(uint256 oldCost, uint256 newCost);
    event Withdraw(address indexed to, uint256 amount);

    constructor() ERC721("ShitNFT", "SHIT") Ownable(_msgSender()) {}

    function mint() external payable {
        if (msg.value != BASIC_COST)
            revert NotEnoughMoney(msg.value, BASIC_COST);
        _safeMint(_msgSender(), tokenIdCounter);

        emit Minted(
            _msgSender(),
            tokenIdCounter,
            BASIC_COST, // должно быть msg.value
            tokenURI(tokenIdCounter),
            block.timestamp
        );
        unchecked {
            tokenIdCounter++;
        }
    }

    function changeBasicCost(uint256 newCost) external onlyOwner {
        uint256 old = BASIC_COST;
        BASIC_COST = newCost;
        emit BasicCostChanged(old, newCost);
    }

    function withdraw() external onlyOwner {
        uint256 totalEther = address(this).balance;
        (bool success, ) = owner().call{value: totalEther}("");
        if (!success) revert TransferError(owner(), totalEther);
        emit Withdraw(owner(), totalEther);
    }

    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _baseURI();
    }
}
