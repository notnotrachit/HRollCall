import { WalletConnect } from "@/components/WalletConnect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Class Ledger</h1>
          <WalletConnect />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Class Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connect your wallet to start managing classes and attendance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;