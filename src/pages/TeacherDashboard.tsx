/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createClass,
  mintNFT,
  createLecture,
  getClasses,
  getLectures,
  getAttendanceRecords,
} from "@/lib/contractService";
import { useWalletContext } from "@/context/WalletContext";
import QRious from "qrious";
import { motion } from "framer-motion";
import Popup from "../components/Popup"; // Assuming Popup component is in components folder
import { HederaService } from "@/lib/hederaService";

interface Class {
  id: string;
  name: string;
  studentCount: number;
  lectureCount: number;
  classAddress: string;
}

interface Lecture {
  id: number;
  topic: string;
}

interface LecturesByClass {
  [classAddress: string]: Lecture[];
}

interface AttendanceByLecture {
  [key: string]: AttendanceRecord[]; // key will be `${classAddress}-${lectureId}`
}

interface AttendanceRecord {
  address: string;
  name: string;
}

interface LectureTopicsByClass {
  [classAddress: string]: string;
}

interface PopupContentType {
  title: string;
  content: React.ReactNode;
}

export function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSymbol, setNewClassSymbol] = useState("");
  const [newLectureTopic, setNewLectureTopic] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [studentName, setStudentName] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [lecturesByClass, setLecturesByClass] = useState<LecturesByClass>({});
  const [attendanceByLecture, setAttendanceByLecture] =
    useState<AttendanceByLecture>({});
  const [qrData, setQrData] = useState<string | null>(null);
  const [lectureTopicsByClass, setLectureTopicsByClass] =
    useState<LectureTopicsByClass>({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState<PopupContentType | null>(
    null
  );
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isCreatingLecture, setIsCreatingLecture] = useState<{
    [key: string]: boolean;
  }>({});
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isFetchingLectures, setIsFetchingLectures] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [realTimeAttendance, setRealTimeAttendance] = useState<{
    [key: string]: any[];
  }>({});
  const [subscriptions, setSubscriptions] = useState<{ [key: string]: boolean }>({});
  const hederaServiceRef = useRef<HederaService>(new HederaService());

  const { provider } = useWalletContext();

  // Add function to ensure Hedera topics exist for all classes
  const ensureHederaTopics = async (classes: Class[]) => {
    const hederaService = hederaServiceRef.current;
    for (const classItem of classes) {
      const existingTopicId = localStorage.getItem(`topic_${classItem.classAddress}`);
      if (!existingTopicId) {
        try {
          console.log(`Creating Hedera topic for existing class ${classItem.name}`);
          const topicId = await hederaService.createAttendanceTopic(classItem.classAddress);
          localStorage.setItem(`topic_${classItem.classAddress}`, topicId);
          console.log(`Created and stored topic ${topicId} for class ${classItem.classAddress}`);
        } catch (error) {
          console.error(`Error creating topic for class ${classItem.name}:`, error);
        }
      }
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingInitialData(true);
        const classList = await getClasses(provider);
        const formattedClasses = classList.map((classData) => ({
          classAddress: classData[0],
          name: classData[1],
          symbol: classData[2],
          studentCount: 0,
          lectureCount: 0,
        }));
        setClasses(formattedClasses);
        
        // Ensure Hedera topics exist for all classes
        await ensureHederaTopics(formattedClasses);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setConfirmationMessage(
          "Failed to load classes. Please refresh the page."
        );
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchInitialData();
  }, [provider]);

  const handleCreateClass = async () => {
    try {
      setIsCreatingClass(true);
      // Create the class contract
      await createClass(newClassName, newClassSymbol, provider);
      
      // Get the updated list of classes to get the new class address
      const classList = await getClasses(provider);
      const newClass = classList[classList.length - 1]; // Get the most recently created class
      const classAddress = newClass[0];

      // Create a Hedera topic for this class
      const hederaService = hederaServiceRef.current;
      const topicId = await hederaService.createAttendanceTopic(classAddress);
      
      // Store the topic ID in localStorage
      localStorage.setItem(`topic_${classAddress}`, topicId);
      console.log(`Created and stored topic ${topicId} for class ${classAddress}`);

      setConfirmationMessage(`Class ${newClassName} created successfully!`);
      setNewClassName("");
      setNewClassSymbol("");
      setIsPopupOpen(false);

      // Update the classes list
      const formattedClasses = classList.map((classData) => ({
        classAddress: classData[0],
        name: classData[1],
        symbol: classData[2],
        studentCount: 0,
        lectureCount: 0,
      }));
      setClasses(formattedClasses);
    } catch (error) {
      console.error("Error creating class:", error);
      setConfirmationMessage("Failed to create class. Please try again.");
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCreateLecture = async (classAddress: string) => {
    const topic = lectureTopicsByClass[classAddress];
    if (!topic) return;

    try {
      setIsCreatingLecture((prev) => ({ ...prev, [classAddress]: true }));
      const id = await createLecture(classAddress, topic, provider);
      setLectureTopicsByClass((prev) => ({
        ...prev,
        [classAddress]: "",
      }));
      await fetchLectures(classAddress);
    } catch (error) {
      console.error("Error creating lecture:", error);
      setConfirmationMessage("Failed to create lecture. Please try again.");
    } finally {
      setIsCreatingLecture((prev) => ({ ...prev, [classAddress]: false }));
    }
  };

  useEffect(() => {
    if (qrData && isPopupOpen) {
      const canvasElements = document.querySelectorAll(
        'canvas[id^="qr-code-"]'
      );
      canvasElements.forEach((canvas) => {
        new QRious({
          element: canvas,
          value: qrData,
          size: 250,
        });
      });
    }
  }, [qrData, isPopupOpen]);

  const handleAddStudent = async () => {
    try {
      setIsAddingStudent(true);
      await mintNFT(selectedClassId, studentAddress, studentName, provider);
      setConfirmationMessage(`Student ${studentName} added successfully!`);
      setStudentAddress("");
      setStudentName("");
      setAdditionalDetails("");
      setSelectedClassId(null);
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Error adding student:", error);
      setConfirmationMessage("Failed to add student. Please try again.");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const openMintForm = (classId: string) => {
    setSelectedClassId(classId);

    const mintFormContent = (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Student Wallet Address:
          </label>
          <input
            type="text"
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
            required
            className="mt-1 block w-full border p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Student Name:
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
            className="mt-1 block w-full border p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Additional Details:
          </label>
          <input
            type="text"
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            className="mt-1 block w-full border p-2 rounded-md"
          />
        </div>
        <Button
          onClick={handleAddStudent}
          className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          Add Student
        </Button>
      </div>
    );

    setPopupContent({
      title: "Add New Student",
      content: mintFormContent,
    });
    setIsPopupOpen(true);
  };

  const fetchLectures = async (classAddress: string) => {
    try {
      setIsFetchingLectures((prev) => ({ ...prev, [classAddress]: true }));
      const lecturesList = await getLectures(classAddress, provider);
      setLecturesByClass((prev) => ({
        ...prev,
        [classAddress]: lecturesList,
      }));
    } catch (error) {
      console.error("Error fetching lectures:", error);
      setConfirmationMessage("Failed to fetch lectures. Please try again.");
    } finally {
      setIsFetchingLectures((prev) => ({ ...prev, [classAddress]: false }));
    }
  };

  const handleTakeAttendance = (id: number, classAddress: string) => {
    const qrData = JSON.stringify({
      lectureId: id,
      classAddress: classAddress,
    });
    setQrData(qrData);

    const qrContent = (
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">
            Scan QR Code to Mark Attendance
          </h3>
          <canvas id={`qr-code-${id}`} className="mb-4" />
        </div>
      </div>
    );

    setPopupContent({
      title: "Take Attendance",
      content: qrContent,
    });
    setIsPopupOpen(true);
  };

  const fetchAttendanceRecords = async (
    lectureId: any,
    classAddress: string
  ) => {
    const [records, names] = await getAttendanceRecords(
      classAddress,
      lectureId,
      provider
    );
    console.log("Fetched attendance records:", records);
    console.log("Fetched student names:", names);
    const attendanceRecords = records.map((address, index) => ({
      address,
      name: names[index],
    }));
    const key = `${classAddress}-${lectureId}`;
    setAttendanceByLecture((prev) => ({
      ...prev,
      [key]: attendanceRecords,
    }));
  };

  const handleViewAttendance = async (
    lectureId: number,
    classAddress: string
  ) => {
    // Show loading state in popup first
    setPopupContent({
      title: "Attendance Records",
      content: <div className="text-center">Loading attendance records...</div>,
    });
    setIsPopupOpen(true);

    // Fetch records directly
    const [records, names] = await getAttendanceRecords(
      classAddress,
      lectureId,
      provider
    );
    const attendanceRecords = records.map((address: string, index: number) => ({
      address,
      name: names[index],
    }));

    // Update state for other uses
    const key = `${classAddress}-${lectureId}`;
    setAttendanceByLecture((prev) => ({
      ...prev,
      [key]: attendanceRecords,
    }));

    // Create content with direct data
    const attendanceContent = (
      <div className="space-y-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Attendance Records</h3>
            <Button
              onClick={() => downloadAttendanceData(classAddress, lectureId)}
              className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Download Records
            </Button>
          </div>
          {attendanceRecords.length > 0 ? (
            <ul className="space-y-2">
              {attendanceRecords.map((student) => (
                <li
                  key={student.address}
                  className="p-2 bg-gray-100 rounded-lg"
                >
                  <span className="font-semibold">{student.name}</span>
                  <br />
                  <span className="text-sm text-gray-600">
                    {student.address}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No attendance records found.</p>
          )}
        </div>
      </div>
    );

    // Update popup with direct data
    setPopupContent({
      title: "Attendance Records",
      content: attendanceContent,
    });
  };

  const downloadAttendanceData = (classAddress: string, lectureId: number) => {
    const key = `${classAddress}-${lectureId}`;
    const records = attendanceByLecture[key];

    if (!records || records.length === 0) {
      alert("No attendance records available to download.");
      return;
    }

    const csvRows = [
      ["Address", "Name"],
      ...records.map((record) => [record.address, record.name]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance_records.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupContent(null);
  };

  const openCreateClassForm = () => {
    const createClassContent = (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Class Name:
          </label>
          <input
            type="text"
            placeholder="Enter class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="mt-1 block w-full border p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Class Symbol:
          </label>
          <input
            type="text"
            placeholder="Enter class symbol"
            value={newClassSymbol}
            onChange={(e) => setNewClassSymbol(e.target.value)}
            className="mt-1 block w-full border p-2 rounded-md"
          />
        </div>
        <Button
          onClick={handleCreateClass}
          disabled={isCreatingClass}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
        >
          {isCreatingClass ? "Creating..." : "Create Class"}
        </Button>
      </div>
    );

    setPopupContent({
      title: "Create New Class",
      content: createClassContent,
    });
    setIsPopupOpen(true);
  };

  useEffect(() => {
    const hederaService = hederaServiceRef.current;
    const newSubscriptions: { [key: string]: boolean } = {};

    // Cleanup function
    const cleanup = () => {
      hederaService.cleanupSubscriptions();
    };

    // Subscribe to attendance updates for each class
    classes.forEach(async (classItem) => {
      const topicId = localStorage.getItem(`topic_${classItem.classAddress}`);
      if (topicId && !subscriptions[topicId]) {
        try {
          console.log(`Setting up subscription for class ${classItem.name} with topic ${topicId}`);
          hederaService.subscribeToAttendance(topicId, (attendanceData) => {
            console.log('Received attendance data:', attendanceData);
            setRealTimeAttendance(prev => ({
              ...prev,
              [classItem.classAddress]: [
                ...(prev[classItem.classAddress] || []),
                attendanceData,
              ],
            }));
          });
          newSubscriptions[topicId] = true;
        } catch (error) {
          console.error(`Failed to subscribe to topic ${topicId}:`, error);
        }
      }
    });

    setSubscriptions(prev => ({ ...prev, ...newSubscriptions }));

    // Cleanup subscriptions when component unmounts
    return cleanup;
  }, [classes]); // Only re-run when classes change

  // Add this useEffect to log real-time attendance updates
  useEffect(() => {
    console.log('Real-time attendance updated:', realTimeAttendance);
  }, [realTimeAttendance]);

  return (
    <div className="py-6 bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen px-6 lg:px-32">
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-indigo-800">
          Teacher Dashboard
        </h1>
        <Button
          onClick={openCreateClassForm}
          className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
        >
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

      {isLoadingInitialData ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading your classes...</p>
        </div>
      ) : (
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
                  <CardTitle className="text-2xl text-indigo-700">
                    {classItem.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Lecture Topic"
                      value={lectureTopicsByClass[classItem.classAddress] || ""}
                      onChange={(e) =>
                        setLectureTopicsByClass((prev) => ({
                          ...prev,
                          [classItem.classAddress]: e.target.value,
                        }))
                      }
                      className="w-full border p-2 rounded"
                    />
                    <Button
                      onClick={() =>
                        handleCreateLecture(classItem.classAddress)
                      }
                      disabled={isCreatingLecture[classItem.classAddress]}
                      className="w-full bg-green-600 hover:bg-green-700 transition-colors duration-200"
                    >
                      {isCreatingLecture[classItem.classAddress]
                        ? "Creating..."
                        : "New Lecture"}
                    </Button>
                    <Button
                      onClick={() => openMintForm(classItem.classAddress)}
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Student
                    </Button>
                    <Button
                      onClick={() => fetchLectures(classItem.classAddress)}
                      disabled={isFetchingLectures[classItem.classAddress]}
                      className="w-full bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
                    >
                      {isFetchingLectures[classItem.classAddress]
                        ? "Loading..."
                        : "View Lectures"}
                    </Button>
                  </div>

                  {isFetchingLectures[classItem.classAddress] ? (
                    <div className="mt-4 text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading lectures...</p>
                    </div>
                  ) : lecturesByClass[classItem.classAddress]?.length === 0 ? (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
                      <p className="text-gray-600">No lectures created yet.</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Create a new lecture to get started!
                      </p>
                    </div>
                  ) : (
                    lecturesByClass[classItem.classAddress]?.map((lecture) => (
                      <div
                        key={lecture.id}
                        className="mt-4 p-4 bg-gray-100 rounded-lg"
                      >
                        <h3 className="text-lg font-semibold text-indigo-600 mb-2">
                          {lecture.topic}
                        </h3>
                        <div className="space-y-2">
                          <Button
                            onClick={() =>
                              handleTakeAttendance(
                                lecture.id,
                                classItem.classAddress
                              )
                            }
                            className="w-full bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200"
                          >
                            Take Attendance
                          </Button>
                          <Button
                            onClick={() =>
                              handleViewAttendance(
                                lecture.id,
                                classItem.classAddress
                              )
                            }
                            className="w-full bg-teal-600 hover:bg-teal-700 transition-colors duration-200"
                          >
                            View Attendance
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {isPopupOpen && popupContent && (
        <Popup title={popupContent.title} onClose={closePopup}>
          {popupContent.content}
        </Popup>
      )}
    </div>
  );
}

export default TeacherDashboard;
