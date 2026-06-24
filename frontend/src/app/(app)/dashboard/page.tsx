import { LayoutDashboard } from 'lucide-react';
import Leaderboard from '../../../components/Leaderboard';

const DashboardPage = () => {
  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-bold mb-4 flex items-center">
        <LayoutDashboard className="mr-2" /> Dashboard
      </h1>
      <Leaderboard />
    </div>
  );
};

export default DashboardPage;
