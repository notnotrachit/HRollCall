import { ethers } from 'ethers';
import ClassFactory from '../../artifacts/contracts/ClassFactory.sol/ClassFactory.json';
import ClassContract from '../../artifacts/contracts/ClassContract.sol/ClassContract.json';

const CONTRACT_ADDRESS = '0x2Cdc7251364d4C0e0e7D83037bE31d095A3c8497';

export const createClass = async (name: string, symbol: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    const tx = await factoryContract.createClass(name, symbol);
    await tx.wait();
};

export const getClasses = async (provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    return await factoryContract.getClasses();
};

export const mintNFT = async (classAddress: string, studentAddress: string, studentName: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const tx = await classContract.mintNFT(studentAddress, studentName); // Pass the name
    await tx.wait();
};

export const createLecture = async (classAddress: string, topic: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const tx = await classContract.createLecture(topic);
    await tx.wait();
};

export const markAttendance = async (classAddress: string, lectureId: any, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    console.log('classAddress', classAddress);
    console.log('lectureId', lectureId);
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const tx = await classContract.markAttendance(lectureId);
    await tx.wait();
};

export const getAttendanceRecords = async (classAddress: string, lectureId: number, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    return await classContract.getAllAttendance(lectureId);
};

export const getOwnAttendance = async (classAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    return await classContract.getOwnAttendance();
};

export const getLectures = async (classAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
    const lectures = await classContract.getLectures();
    return lectures;
};

export const getEligibleClasses = async (studentAddress: string, provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    const classFactoryContract = new ethers.Contract(CONTRACT_ADDRESS, ClassFactory.abi, signer);
    const eligibleClasses = await classFactoryContract.getEligibleClasses(studentAddress);
    return eligibleClasses;
};
