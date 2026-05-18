import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: "CheckCircle" | "AlertTriangle" | "TrendingUp" | "Users";
  iconColor: "green" | "red" | "amber" | "blue";
}

const iconComponents: Record<string, LucideIcon> = {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
};

const colorClasses: Record<string, string> = {
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  amber: "bg-amber-100 text-amber-600",
  blue: "bg-blue-100 text-blue-600",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
}: StatCardProps) {
  const IconComponent = iconComponents[icon];

  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-bold tracking-tight mb-2">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className={`absolute top-4 right-4 p-3 rounded-full ${colorClasses[iconColor]}`}>
        <IconComponent className="w-5 h-5" />
      </div>
    </Card>
  );
}
