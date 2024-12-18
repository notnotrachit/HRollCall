import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClass, mintNFT, createLecture, getClasses, getLectures, getAttendanceRecords } from '@/lib/contractService';
import { useWalletContext } from '@/context/WalletContext';
import QRious from 'qrious';
import { motion } from "framer-motion";

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
    <div className="container mx-auto p-6 bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen">
      <motion.div 
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-indigo-800">Teacher Dashboard</h1>
        <Button onClick={handleCreateClass} className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
          Create New Class
        </Button>
      </motion.div>

      {confirmationMessage && (
        <motion.p 
          className="text-green-500 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {confirmationMessage}
        </motion.p>
      )}

      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <input
          type="text"
          placeholder="Class Name"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="text"
          placeholder="Class Symbol"
          value={newClassSymbol}
          onChange={(e) => setNewClassSymbol(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <Button onClick={handleCreateClass} className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
          Create Class
        </Button>
      </motion.div>

      {showMintForm && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddStudent();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Wallet Address:</label>
                  <input
                    type="text"
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Name:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Details:</label>
                  <input
                    type="text"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
                  Add Student
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {classes.map((classItem, index) => (
          <motion.div
            key={classItem.classAddress}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-700">{classItem.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">Students: {classItem.studentCount}</p>
                  <p className="text-gray-600">Lectures: {classItem.lectureCount}</p>
                  <input
                    type="text"
                    placeholder="Lecture Topic"
                    value={newLectureTopic}
                    onChange={(e) => setNewLectureTopic(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                  <Button onClick={() => handleCreateLecture(classItem.classAddress, newLectureTopic)} className="w-full bg-green-600 hover:bg-green-700 transition-colors duration-200">
                    New Lecture
                  </Button>
                  {qrData && (
                    <div className="mt-4">
                      <canvas id="qr-code" className="mx-auto" />
                    </div>
                  )}
                  <Button onClick={() => openMintForm(classItem.classAddress)} className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                    Add Student
                  </Button>
                  <Button onClick={() => fetchLectures(classItem.classAddress)} className="w-full bg-purple-600 hover:bg-purple-700 transition-colors duration-200">
                    View Lectures
                  </Button>
                </div>
                {lectures.map((lecture) => (
                  <div key={lecture.id} className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">{lecture.topic}</h3>
                    <div className="space-y-2">
                      <Button onClick={() => handleTakeAttendance(lecture.id, classItem.classAddress)} className="w-full bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200">
                        Take Attendance
                      </Button>
                      <Button onClick={() => handleViewAttendance(lecture.id, classItem.classAddress)} className="w-full bg-teal-600 hover:bg-teal-700 transition-colors duration-200">
                        View Attendance
                      </Button>
                    </div>
                    {qrData && (
                      <div className="mt-4">
                        <canvas id="qr-code" className="mx-auto" />
                      </div>
                    )}
                    {attendanceRecords.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {attendanceRecords.map((student) => (
                          <li key={student.address} className="p-2 bg-white rounded shadow">
                            <span className="font-semibold">{student.name}</span> ({student.address})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default TeacherDashboard;

