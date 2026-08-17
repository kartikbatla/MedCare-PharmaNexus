import type { ReactNode } from 'react';
import { Card, CardHeader } from '../ui/Card';

export const chartColors = {
  navy: '#0F223A',
  muted: '#2F466F',
  light: '#8FA3C8',
  warm: '#C8BFA8',
  success: '#3E7C4F',
  warning: '#B07A1F',
  danger: '#B3452F',
  grid: 'rgba(15, 34, 58, 0.08)',
};

export const chartTooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid rgba(15, 34, 58, 0.12)',
  borderRadius: '10px',
  boxShadow: '0 4px 16px rgba(15, 34, 58, 0.1)',
  fontSize: '12px',
  color: '#1C1C1C',
  padding: '8px 12px',
};

export const axisStyle = {
  fontSize: 11,
  fill: 'rgba(28, 28, 28, 0.45)',
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
  className?: string;
}

export default function ChartCard({ title, subtitle, icon, action, children, height = 280, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} icon={icon} action={action} />
      <div className="px-3 pb-4 pt-1" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}
