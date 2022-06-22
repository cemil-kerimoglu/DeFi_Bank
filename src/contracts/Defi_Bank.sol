pragma solidity >=0.5.0 <0.9.0;

import "./Token.sol";

contract Defi_Bank {
    
  Token private token;
  event Deposit(address indexed user, uint amountDeposited, uint totalAmount, uint time);
  event Withdraw(address indexed user, uint amountWithdrawn, uint totalAmount, uint time);
  event EarnInterest(address indexed user, uint depositTime, uint interest);

  constructor(Token _token) public { // Here, when you input the smart contract what you
  // do in reality is inputting its address. Token variable is a smart contract variable
  // that we defined above. But _token will be the address of the smart contract that
  // we want to input here.
    token = _token;
  }

  mapping(address => uint[]) public depositUpdateAmount;
  mapping(address => uint[]) public depositUpdateTime;
  mapping(address => bool) public earningInterest;

  function deposit() payable public {
    require(msg.value >= 1e16); // Minimum deposit amount is 0.01 ether. Remember, 1 ether = 1e18 wei.
    if(earningInterest[msg.sender] == false) {
      depositUpdateAmount[msg.sender].push(msg.value);
      earningInterest[msg.sender] = true;
      depositUpdateTime[msg.sender].push(block.timestamp);
      emit Deposit(msg.sender, msg.value, msg.value, block.timestamp);
    }
    else if(earningInterest[msg.sender] == true) {
      uint totalAmount = depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)];
      totalAmount = totalAmount + msg.value;
      depositUpdateAmount[msg.sender].push(totalAmount); 
      depositUpdateTime[msg.sender].push(block.timestamp);
      emit Deposit(msg.sender, msg.value, totalAmount, block.timestamp);
    }
  }

  function withdraw(uint _amount) public {
    require(earningInterest[msg.sender] == true);
    require( _amount <= depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)] );
    uint amountWithdrawn = _amount;
    msg.sender.transfer(amountWithdrawn);
    uint amountLeft = depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)] - amountWithdrawn; 
    depositUpdateAmount[msg.sender].push(amountLeft);
    depositUpdateTime[msg.sender].push(block.timestamp);
    if(amountLeft == 0) {
        earningInterest[msg.sender] = false;
    }
    emit Withdraw(msg.sender, amountWithdrawn, amountLeft, block.timestamp); 
  }

  function earnInterest() public {
    // 10% APY
    // In Solidity the time is designated in seconds.
    // 31668017 is the interest (10% APY) per second for minimum deposit amount (0.01 ETH)
    // because 1e15 (10% of 0.01 ETH) / 31577600 (seconds in 365.25 days)
    require(depositUpdateAmount[msg.sender].length > 0);
    uint totalInterestEarned;
    for(uint i = 0; i < (depositUpdateTime[msg.sender].length - 1); i++) {
      totalInterestEarned = totalInterestEarned + ( 31668017 * (depositUpdateAmount[msg.sender][i] / 1e16) * (depositUpdateTime[msg.sender][i+1] - depositUpdateTime[msg.sender][i]) ); 
    }
    totalInterestEarned = totalInterestEarned + ( 31668017 * (depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)] / 1e16) * (block.timestamp - depositUpdateTime[msg.sender][(depositUpdateTime[msg.sender].length - 1)]) );
    token.mint(msg.sender, totalInterestEarned);
    depositUpdateTime[msg.sender] = new uint[](0);
    if(depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)] > 0) {
      depositUpdateTime.push(block.timestamp);
      remainingDeposit = depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)];
      depositUpdateAmount[msg.sender] = new uint[](0); 
      depositUpdateAmount.push(remainingDeposit);
    }
    else {
      depositUpdateAmount[msg.sender] = new uint[](0);      
    }
  }  

/*
  function viewInterest() public view returns(uint) {
    uint totalInterestEarned;
    if(depositUpdateAmount[msg.sender].length > 0) {
      for(uint i = 0; i < (depositUpdateTime[msg.sender].length - 1); i++) {
      totalInterestEarned = totalInterestEarned + ( 31668017 * (depositUpdateAmount[msg.sender][i] / 1e16) * (depositUpdateTime[msg.sender][i+1] - depositUpdateTime[msg.sender][i]) ); 
    }
      totalInterestEarned = totalInterestEarned + ( 31668017 * (depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)] / 1e16) * (block.timestamp - depositUpdateTime[msg.sender][(depositUpdateTime[msg.sender].length - 1)]) );
    }
    else {
      totalInterestEarned = 0;
    }

    return totalInterestEarned;    
  }

  function viewCurrentDeposit() public view returns(uint) {
    return depositUpdateAmount[msg.sender][(depositUpdateAmount[msg.sender].length - 1)]; 
  }
*/

}