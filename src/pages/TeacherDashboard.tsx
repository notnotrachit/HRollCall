import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClass, mintNFT, createLecture, getClasses, getLectures, getAttendanceRecords } from '@/lib/contractService';
import { useWalletContext } from '@/context/WalletContext';
import QRious from 'qrious';

interface Class {
  id: string;
  name: string;
  studentCount: number;
  lectureCount: number;
  classAddress: string;
}

interface Lecture {
  id: string;
  topic: string;
}

export function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSymbol, setNewClassSymbol] = useState('');
  const [newLectureTopic, setNewLectureTopic] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [studentName, setStudentName] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showMintForm, setShowMintForm] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [qrData, setQrData] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<[]>([]);
  const { provider } = useWalletContext();

  useEffect(() => {
    const fetchClasses = async () => {
      const classList = await getClasses(provider);
      console.log('Fetched classes:', classList);
      const formattedClasses = classList.map((classData) => {
        return {
          classAddress: classData[0],
          name: classData[1],
          symbol: classData[2],
          studentCount: 0, // Initialize with 0 or fetch if available
          lectureCount: 0   // Initialize with 0 or fetch if available
        };
      });
      console.log('Formatted classes:', formattedClasses);
      setClasses(formattedClasses);
    };
    fetchClasses();
  }, [provider]);

  const handleCreateClass = async () => {
    await createClass(newClassName, newClassSymbol, provider);
    setConfirmationMessage(`Class ${newClassName} created successfully!`);
    setNewClassName('');
    setNewClassSymbol('');
    // Refresh classes after creating a new one
    const classList = await getClasses(provider);
    const formattedClasses = classList.map((classData) => {
      return {
        classAddress: classData[0],
        name: classData[1],
        symbol: classData[2],
        studentCount: 0,
        lectureCount: 0
      };
    });
    setClasses(formattedClasses);
  };

  const handleCreateLecture = async (classAddress: string, topic: string) => {
    console.log('Creating lecture for class address:', classAddress); // Log the class address
    const id = await createLecture(classAddress, topic, provider);
    const qrData = JSON.stringify({ lectureId: id, classAddress: classAddress });
    setQrData(qrData); // Store the QR data for QR code generation
  };

  useEffect(() => {
    if (qrData) {
      console.log('Generating QR code for lecture ID and class address:', qrData);
      const qr = new QRious({
        element: document.getElementById('qr-code'),
        value: qrData, // Use the new QR data
        size: 200,
      });
    }
  }, [qrData]);

  const handleAddStudent = async () => {
    await mintNFT(selectedClassId, studentAddress, studentName, provider);
    setConfirmationMessage(`Student ${studentName} added to class ${selectedClassId} successfully!`);
    setStudentAddress('');
    setStudentName('');
    setAdditionalDetails('');
    setSelectedClassId(null);
    setShowMintForm(false);
  };

  const openMintForm = (classId: string) => {
    setSelectedClassId(classId);
    setShowMintForm(true);
  };

  const fetchLectures = async (classAddress: string) => {
    const lecturesList = await getLectures(classAddress, provider);
    console.log('Fetched lectures:', lecturesList);
    setLectures(lecturesList);
  };

  const handleTakeAttendance = (id: string, classAddress: string) => {
    setQrData(JSON.stringify({ lectureId: id, classAddress: classAddress})); // Set the lecture ID for QR code generation
  };

  const fetchAttendanceRecords = async (lectureId: any, classAddress: string) => {
    const [records, names] = await getAttendanceRecords(classAddress, lectureId, provider);
    console.log('Fetched attendance records:', records);
    console.log('Fetched student names:', names);
    setAttendanceRecords(records.map((address, index) => ({ address, name: names[index] }))); // Combine addresses and names
  };

  const handleViewAttendance = (lectureId: string, classAddress: string) => {
    fetchAttendanceRecords(lectureId, classAddress);

  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <Button onClick={handleCreateClass}>Create New Class</Button>
      </div>

      {confirmationMessage && (
        <p className="text-green-500 mb-4">{confirmationMessage}</p>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Class Name"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Class Symbol"
          value={newClassSymbol}
          onChange={(e) => setNewClassSymbol(e.target.value)}
          className="border p-2 mr-2"
        />
        <Button onClick={handleCreateClass}>Create Class</Button>
      </div>

      {showMintForm && (
        <div className="mb-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddStudent();
          }}>
            <label>
              Student Wallet Address:
              <input
                type="text"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                required
              />
            </label>
            <label>
              Student Name:
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </label>
            <label>
              Additional Details:
              <input
                type="text"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
              />
            </label>
            <button type="submit">Add Student</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem) => (
          <Card key={classItem.classAddress}>
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Students: {classItem.studentCount}</p>
                <p>Lectures: {classItem.lectureCount}</p>
                <input
                  type="text"
                  placeholder="Lecture Topic"
                  value={newLectureTopic}
                  onChange={(e) => setNewLectureTopic(e.target.value)}
                  className="border p-2"
                />
                <Button onClick={() => handleCreateLecture(classItem.classAddress, newLectureTopic)}>
                  New Lecture
                </Button>
                {qrData && (
                  <div>
                    <canvas id="qr-code" />
                  </div>
                )}
                <Button onClick={() => openMintForm(classItem.classAddress)}>
                  Add Student
                </Button>
                <Button onClick={() => fetchLectures(classItem.classAddress)}>View Lectures</Button>
              </div>
              {lectures.map((lecture) => (
                <div key={lecture.id}>
                  <h3>{lecture.topic}</h3>
                  <Button onClick={() => handleTakeAttendance(lecture.id, classItem.classAddress)}>Take Attendance</Button>
                  <Button onClick={() => handleViewAttendance(lecture.id, classItem.classAddress)}>View Attendance</Button>
                  {qrData && (
                    <div>
                      <canvas id="qr-code" />
                    </div>
                  )}
                  {attendanceRecords.length > 0 && (
                    <ul>
                      {attendanceRecords.map((student) => (
                        <li key={student.address}>{student.name} ({student.address})</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TeacherDashboard;
