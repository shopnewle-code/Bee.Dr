import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

interface RiskRadarChartProps {
  analysis: {
    overallRisks?: { condition: string; level: string; explanation: string }[];
    tests?: { name: string; status: string; value: string; unit: string; normalRange: string }[];
  };
}

const levelToScore = (level: string) => {
  switch (level) {
    case 'high': return 90;
    case 'medium': return 55;
    case 'low': return 20;
    default: return 30;
  }
};

const statusToScore = (status: string) => {
  switch (status) {
    case 'critical': return 95;
    case 'high': return 70;
    case 'low': return 60;
    case 'normal': return 15;
    default: return 30;
  }
};

export default function RiskRadarChart({ analysis }: RiskRadarChartProps) {
  // Build radar data from risks
  const riskData = analysis.overallRisks?.map(r => ({
    category: r.condition,
    risk: levelToScore(r.level),
    fullMark: 100,
  })) || [];

  // Build test deviation data
  const testData = analysis.tests?.slice(0, 8).map(t => ({
    category: t.name,
    risk: statusToScore(t.status),
    fullMark: 100,
  })) || [];

  const radarData = riskData.length > 0 ? riskData : testData;

  // Calculate overall health score from data
  const avgRisk = radarData.length > 0
    ? radarData.reduce((sum, d) => sum + d.risk, 0) / radarData.length
    : 30;
  const healthScore = Math.round(100 - avgRisk);

  return (
    <div className="space-y-6">
      {/* Health Score Circle */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl p-6 text-center">
        <div className="relative w-28 h-28 mx-auto mb-3">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="60" cy="60" r="50" fill="none"
              stroke={healthScore >= 70 ? 'hsl(var(--success))' : healthScore >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
              strokeWidth="8"
              strokeDasharray={`${healthScore * 3.14} 314`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold text-foreground">{healthScore}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
        <h3 className="font-display font-bold text-foreground text-lg">AI Health Score</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {healthScore >= 80 ? 'Excellent health overall' :
           healthScore >= 60 ? 'Good health with some areas to watch' :
           healthScore >= 40 ? 'Several areas need attention' :
           'Multiple critical areas detected'}
        </p>
      </motion.div>

      {/* Radar Chart */}
      {radarData.length >= 3 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-primary" /> Health Risk Radar
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <RechartsRadar
                  name="Risk Level"
                  dataKey="risk"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Higher values indicate greater risk — aim for smaller radar area
          </p>
        </motion.div>
      )}

      {/* Risk Breakdown */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="space-y-2">
        <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Risk Breakdown
        </h3>
        {radarData.map((d, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{d.category}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                d.risk >= 70 ? 'bg-destructive/10 text-destructive' :
                d.risk >= 40 ? 'bg-warning/10 text-warning' :
                'bg-success/10 text-success'
              }`}>
                {d.risk >= 70 ? 'High' : d.risk >= 40 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.risk}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                className={`h-full rounded-full ${
                  d.risk >= 70 ? 'bg-destructive' :
                  d.risk >= 40 ? 'bg-warning' :
                  'bg-success'
                }`}
              />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
