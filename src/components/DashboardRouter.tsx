import React, { useState } from 'react';
import TeacherDashboard from '@/pages/TeacherDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import { Button } from '@/components/ui/button';
import { useWalletContext } from '@/context/WalletContext';

export function DashboardRouter() {
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const { isConnected, address, connectWallet } = useWalletContext();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Welcome to ClassLedger</h1>
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-6">Select your role</h2>
        <p className="mb-4 text-sm text-muted-foreground">Connected: {address}</p>
        <div className="space-x-4">
          <Button onClick={() => setUserRole('teacher')}>I'm a Teacher</Button>
          <Button onClick={() => setUserRole('student')}>I'm a Student</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {userRole === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
      <Button 
        onClick={() => setUserRole(null)} 
        variant="outline"
        className="fixed bottom-4 right-4"
      >
        Switch Role
      </Button>
    </div>
  );
}

export default DashboardRouter;
