pragma solidity >=0.4.21 <0.7.0;

contract SimpleStorage {
  uint userCount;

  mapping(address => string) public hashes;
  mapping(address => uint8) public imageCount;

  struct User {
    uint id;
    string email;
    string username;
  }

  event CreatedUser (
    uint id,
    string email,
    string username
  );

  event UserCredentials (
    uint id,
    string email,
    string username
  );

  mapping(address => User) public addressToUser;
  mapping(address => uint) public userCounter;

  modifier isCreated() {
    require(userCounter[msg.sender] < 1, 'User is already created!');
    _;
  }

  function createUser(string memory _email, string memory _username) public isCreated {
    User memory newUser = User(userCount, _email, _username);
    addressToUser[msg.sender] = newUser;
    userCounter[msg.sender] = 1;
    userCount++;
    emit CreatedUser(userCount, _email, _username);
  }

  function getUserCredentials() public view returns (
    uint userId, string memory userEmail, string memory userUsername, uint testNumber
  ) {
    testNumber = 1;
    User memory user = addressToUser[msg.sender];
    userId = user.id;
    userEmail = user.email;
    userUsername = user.username;
  }

  function set(string memory x) public {
    require(imageCount[msg.sender] < 1, 'User can generate one image.');
    hashes[msg.sender] = x;
    imageCount[msg.sender]++;
  }

  function get() public view returns (string memory) {
    string memory hashValue = hashes[msg.sender];
    return hashValue;
  }
}
