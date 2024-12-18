import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { markAttendance, getOwnAttendance, getEligibleClasses } from '@/lib/contractService';
import { useWalletContext } from '@/context/WalletContext';
import QrScanner from 'react-qr-scanner';
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QrCode, CheckCircle, XCircle } from 'lucide-react';

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
    console.log('Student Address:', studentAddress);
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
      const parsedData = JSON.parse(data.text);
      setScannedLectureId(parsedData.lectureId);
      setClassAddress(parsedData.classAddress);
      setIsScanning(false)
    }
  };

  const handleError = (err: any) => {
    console.error(err);
  };

  const handleMarkAttendance = async () => {
    console.log('Scanned Lecture ID:', scannedLectureId);
    if (scannedLectureId && classAddress) {
      await markAttendance(classAddress, scannedLectureId, provider);
      alert('Attendance marked successfully!');
      setScannedLectureId(null);
      setClassAddress(null);
    }
  };

  const handleScanButtonClick = () => {
    setIsScanning(true);
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <motion.h1 
        className="text-4xl font-bold mb-8 text-indigo-800 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Student Dashboard
      </motion.h1>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="classes">Eligible Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-700 flex items-center">
                  <QrCode className="mr-2" /> Scan Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <Button onClick={handleScanButtonClick} className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
                    {isScanning ? 'Cancel Scan' : 'Scan QR Code'}
                  </Button>
                  {isScanning && (
                    <div className="w-full max-w-sm mx-auto">
                      <QrScanner
                        onScan={handleScan}
                        onError={handleError}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                  {scannedLectureId && (
                    <Button onClick={handleMarkAttendance} className="bg-green-600 hover:bg-green-700 transition-colors duration-200">
                      Mark Attendance for Scanned Lecture
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-700">Your Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <ul className="space-y-4">
                    {attendanceRecords.map((record, index) => (
                      <motion.li
                        key={index}
                        className={`p-3 rounded-lg flex items-center ${
                          record ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        {record ? (
                          <CheckCircle className="mr-2" />
                        ) : (
                          <XCircle className="mr-2" />
                        )}
                        {record ? 'Present' : 'Absent'} - Lecture {index + 1}
                      </motion.li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="classes">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Eligible Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibleClasses.map((classItem, index) => (
                <motion.div
                  key={classItem.classAddress}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-xl text-indigo-600">{classItem.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="mb-2">
                        {classItem.symbol}
                      </Badge>
                      <p className="text-gray-600 mt-2">Class Address: {classItem.classAddress.slice(0, 6)}...{classItem.classAddress.slice(-4)}</p>
                      <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
                        Enroll in Class
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentDashboard;

