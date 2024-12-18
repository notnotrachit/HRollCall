/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import ClassFactory from './contracts/ClassFactory.sol/ClassFactory.json';
import ClassContract from './contracts/ClassContract.sol/ClassContract.json';
import { HederaService } from './hederaService';

const CONTRACT_ADDRESS = '0xc44f71964b613B22da8b14beE8E0dD1c8e423Ed1';
const hederaService = new HederaService();

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
    try {
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Handle BigNumber lectureId
        const validLectureId = lectureId.hex ? 
            parseInt(lectureId.hex, 16) : // Convert hex to decimal if it's a BigNumber
            Number(lectureId);            // Otherwise try normal number conversion
            
        if (isNaN(validLectureId)) {
            throw new Error('Invalid lecture ID');
        }

        // Sign the attendance data
        const timestamp = Date.now();
        const message = ethers.utils.solidityKeccak256(
            ['address', 'uint256', 'uint256'],
            [address, validLectureId, timestamp]
        );
        const signature = await signer.signMessage(ethers.utils.arrayify(message));

        // Submit to blockchain
        const classContract = new ethers.Contract(classAddress, ClassContract.abi, signer);
        const tx = await classContract.markAttendance(validLectureId);
        await tx.wait();

        // Submit to Hedera Consensus Service
        const attendanceData = {
            studentAddress: address,
            lectureId: validLectureId,
            timestamp,
            signature
        };

        // Get or create topic ID for this class
        let topicId = localStorage.getItem(`topic_${classAddress}`);
        if (!topicId) {
            try {
                topicId = await hederaService.createAttendanceTopic(classAddress);
                localStorage.setItem(`topic_${classAddress}`, topicId);
            } catch (error) {
                console.error('Error creating Hedera topic:', error);
                // Continue with blockchain attendance even if Hedera fails
                return;
            }
        }

        try {
            await hederaService.submitAttendance(topicId!, attendanceData);
        } catch (error) {
            console.error('Error submitting to Hedera:', error);
            // Attendance is already marked on blockchain, so we can continue
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        throw error;
    }
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
