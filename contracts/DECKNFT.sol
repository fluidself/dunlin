// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DECKNFT is ERC721, ERC721Enumerable, ERC721URIStorage {
    using Counters for Counters.Counter;
    using Strings for uint256;
    Counters.Counter private _tokenIds;

    mapping(string => uint256) public tokenURIToTokenId;

    event TokenMinted(
        address indexed owner,
        uint256 tokenId,
        string indexed tokenURI
    );

    constructor() ERC721("DECK NFT", "DECK") {}

    function createToken(string memory _tokenURI) public returns (uint256) {
        require(bytes(_tokenURI).length > 0, "tokenURI cannot be empty");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        tokenURIToTokenId[_tokenURI] = newItemId;

        emit TokenMinted(msg.sender, newItemId, _tokenURI);

        return newItemId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
