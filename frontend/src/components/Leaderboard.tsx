'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface LeaderboardUser {
  name: string;
  averageScore: number;
  totalSessions: number;
}

const rankEmoji = (i: number) => {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `#${i + 1}`;
};

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setUsers(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      Loading leaderboard...
    </div>
  );

  if (error) return (
    <div className="text-destructive text-sm py-4 text-center">{error}</div>
  );

  if (users.length === 0) return (
    <div className="text-muted-foreground text-sm py-8 text-center">
      No completed sessions yet. Be the first on the leaderboard!
    </div>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 p-4 border-b">
          <Trophy size={18} className="text-yellow-500" />
          <span className="font-semibold text-sm">Top Performers</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left py-2 px-4 font-medium text-muted-foreground">Rank</th>
              <th className="text-left py-2 px-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-2 px-4 font-medium text-muted-foreground">Avg Score</th>
              <th className="text-left py-2 px-4 font-medium text-muted-foreground">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-base">{rankEmoji(i)}</td>
                <td className="py-3 px-4 font-medium">{user.name}</td>
                <td className="py-3 px-4">
                  <span className={`font-semibold ${user.averageScore >= 75 ? 'text-green-600' : user.averageScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {user.averageScore}%
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{user.totalSessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
