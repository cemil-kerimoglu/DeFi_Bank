pragma solidity >=0.5.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

  uint256 private _cap;

  constructor(uint256 cap) public payable ERC20("Dogemoon", "DGMN") {
    require(cap > 0, "Cap cannot be 0");
    _cap = cap;
    minter = msg.sender;
  }

  event MinterChanged(address indexed from, address to);
  address public minter;

  function cap() public view returns (uint256) {
        return _cap;
    }

  function passMinterRole(address defiBank) public returns (bool) {
    require(msg.sender == minter);
    minter = defiBank;

    emit MinterChanged(msg.sender, defiBank);
    return true;
  }

  function mint(address account, uint256 amount) public {
    require(msg.sender == minter);
    require(totalSupply().add(value) <= _cap, "ERC20Capped: cap exceeded");
	  _mint(account, amount);
  }

  

  

}