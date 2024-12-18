import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { markAttendance, getOwnAttendance, getEligibleClasses } from '@/lib/contractService';
import { useWalletContext } from '@/context/WalletContext';
import QrScanner from 'react-qr-scanner';

interface EnrolledClass {
  id: string;
  name: string;
  teacherName: string;
  attendancePercentage: number;
}

interface ClassInfo {
  classAddress: string;
  name: string;
  symbol: string;
}

export function StudentDashboard() {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<boolean[]>([]);
  const [eligibleClasses, setEligibleClasses] = useState<ClassInfo[]>([]);
  const { provider } = useWalletContext();
  const [scannedLectureId, setScannedLectureId] = useState<string | null>(null);
  const [classAddress, setClassAddress] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const fetchAttendance = async (classAddress: string) => {
      const records = await getOwnAttendance(classAddress, provider);
      setAttendanceRecords(records);
    };

    enrolledClasses.forEach((classItem) => {
      fetchAttendance(classItem.id);
    });
  }, [enrolledClasses, provider]);

  const fetchEligibleClasses = async () => {
    const studentAddress = await provider.getSigner().getAddress();
    console.log('Student Address:', studentAddress); // Log the student address
    const classes = await getEligibleClasses(studentAddress, provider);
    console.log('Fetched eligible classes:', classes);
    setEligibleClasses(classes);
  };

  useEffect(() => {
    fetchEligibleClasses();
  }, []);

  const handleScan = (data: any | null) => {
    if (data) {
      console.log('Scanned data:', data);
      const parsedData = JSON.parse(data.text); // Parse the scanned data
      setScannedLectureId(parsedData.lectureId); // Set the lecture ID
      setClassAddress(parsedData.classAddress); // Set the class address
      setIsScanning(false)
    }
  };

  const handleError = (err: any) => {
    console.error(err);
  };

  const handleMarkAttendance = async () => {
    console.log('Scanned Lecture ID:', scannedLectureId); // Log the scanned ID
    if (scannedLectureId && classAddress) {
      await markAttendance(classAddress, scannedLectureId, provider);
      alert('Attendance marked successfully!'); // Provide feedback
      setScannedLectureId(null); // Reset the scanned lecture ID
      setClassAddress(null); // Reset class address
    }
  };

  const handleScanButtonClick = () => {
    setIsScanning(true); // Activate the scanner
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      <button onClick={handleScanButtonClick} className="mb-4">Scan QR Code</button>
      {isScanning && <QrScanner onScan={handleScan} onError={handleError} />}
      {scannedLectureId && (
        <button onClick={handleMarkAttendance}>Mark Attendance for Scanned Lecture</button>
      )}
      <p>Your Attendance Records:</p>
      <ul>
        {attendanceRecords.map((record, index) => (
          <li key={index}>{record ? 'Present' : 'Absent'}</li>
        ))}
      </ul>
      <h2 className="text-2xl font-bold mb-4">Eligible Classes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eligibleClasses.map((classItem) => (
          <div key={classItem.classAddress}>
            <h3>{classItem.name}</h3>
            <p>Symbol: {classItem.symbol}</p>
            {/* Add a button or link to enroll in the class */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;
