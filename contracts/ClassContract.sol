// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ClassContract is ERC721Enumerable, Ownable {
    struct Lecture {
        uint256 id;
        string topic;
        uint256 date;
    }

    mapping(uint256 => Lecture) public lectures;
    mapping(address => mapping(uint256 => bool)) public attendance;
    uint256 public lectureCount;
    mapping(uint256 => string) private _studentNames;

    constructor(string memory name, string memory symbol, address initialOwner) 
        ERC721(name, symbol) 
        Ownable(initialOwner) 
    {}

    function mintNFT(address student, string memory studentName) public onlyOwner {
        uint256 tokenId = totalSupply() + 1;
        _mint(student, tokenId);
        _studentNames[tokenId] = studentName;
    }

    function createLecture(string memory topic) public onlyOwner {
        lectureCount++;
        lectures[lectureCount] = Lecture(lectureCount, topic, block.timestamp);
    }

    function markAttendance(uint256 lectureId) public {
        require(lectureId > 0 && lectureId <= lectureCount, "Lecture does not exist");
        require(balanceOf(msg.sender) > 0, "You do not hold the NFT");
        attendance[msg.sender][lectureId] = true;
    }


    function getOwnAttendance() public view returns (bool[] memory) {
        uint256 totalLectures = lectureCount;
        bool[] memory ownAttendance = new bool[](totalLectures);

        for (uint256 i = 1; i <= totalLectures; i++) {
            ownAttendance[i - 1] = attendance[msg.sender][i];
        }
        return ownAttendance;
    }

    function getLectures() public view returns (Lecture[] memory) {
        uint256 totalLectures = lectureCount;
        Lecture[] memory lecturesList = new Lecture[](totalLectures);

        for (uint256 i = 1; i <= totalLectures; i++) {
            lecturesList[i - 1] = lectures[i];
        }
        return lecturesList;
    }


    function getAllAttendance(uint256 lectureId) public view onlyOwner returns (address[] memory, string[] memory) {
        uint256 totalStudents = totalSupply();
        address[] memory students = new address[](totalStudents);
        string[] memory studentNames = new string[](totalStudents);
        uint256 count = 0;

        for (uint256 i = 0; i < totalStudents; i++) {
            address student = ownerOf(i + 1);
            if (attendance[student][lectureId]) {
                students[count] = student;
                studentNames[count] = _studentNames[i + 1]; // Retrieve the student's name
                count++;
            }
        }

        // Resize the arrays to the number of attended students
        address[] memory attendedStudents = new address[](count);
        string[] memory attendedStudentNames = new string[](count);
        for (uint256 j = 0; j < count; j++) {
            attendedStudents[j] = students[j];
            attendedStudentNames[j] = studentNames[j];
        }
        return (attendedStudents, attendedStudentNames);
    }

    function getStudentName(uint256 tokenId) public view returns (string memory) {
        return _studentNames[tokenId];
    }


const fetchAttendanceRecords = async (lectureId: any, classAddress: string) => {
    const [records, names] = await getAttendanceRecords(classAddress, lectureId, provider);
    console.log('Fetched attendance records:', records);
    console.log('Fetched student names:', names);
    setAttendanceRecords(records.map((address, index) => ({ address, name: names[index] }))); // Combine addresses and names
};
    function getStudentName(uint256 tokenId) public view returns (string memory) {
        return _studentNames[tokenId];
    }
}
