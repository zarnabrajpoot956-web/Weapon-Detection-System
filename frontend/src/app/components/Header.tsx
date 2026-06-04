import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="h-20 border-b border-border bg-card px-8 flex items-center justify-between">
      <div>
        <h2 className="text-xl text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative">
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-6 h-6 text-foreground" />
          <span className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
            6
          </span>
        </button>
      </div>
    </div>
  );
}
