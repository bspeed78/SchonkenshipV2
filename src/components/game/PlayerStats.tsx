
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ShieldX } from 'lucide-react';

interface PlayerStatsProps {
  playerName: string;
  hits: number;
  misses: number;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerName, hits, misses }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">{playerName} Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center"><Target className="w-4 h-4 mr-2 text-accent" /> Hits:</span>
          <span>{hits}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center"><ShieldX className="w-4 h-4 mr-2 text-blue-500" /> Misses:</span>
          <span>{misses}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerStats;
