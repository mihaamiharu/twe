import { Link } from '@tanstack/react-router';
import { CheckCircle2, Zap, Lock, Swords, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { difficultyColors } from '@/lib/constants';
import type { TFunction } from 'i18next';

export interface ChallengeListRowProps {
  challenge: {
    slug: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    xpReward: number;
    isCompleted: boolean;
  };
  index: number;
  config: {
    color: string;
    icon: React.ReactNode;
    label: string;
  };
  isComingSoon: boolean;
  isBoss: boolean;
  params: { locale: string; slug: string };
  t: TFunction;
}

export function ChallengeListRow({
  challenge,
  index,
  config,
  isComingSoon,
  isBoss,
  params,
  t,
}: ChallengeListRowProps) {
  const RowContent = (
    <>
      <TableCell className="font-mono text-xs text-muted-foreground w-[60px] pl-4">
        <div className="flex items-center gap-2">
          {String(index + 1).padStart(2, '0')}
          {challenge.isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
      </TableCell>
      <TableCell className="w-full min-w-[300px]">
        <div className="flex flex-col">
          <Link to="/$locale/challenges/$slug" params={params} className={cn("font-medium text-sm flex items-center gap-2 w-fit hover:underline decoration-primary/50 underline-offset-4", isBoss && "text-red-500")}>
            {challenge.title}
            {isBoss && <Swords className="h-3 w-3" />}
            {isComingSoon && <Lock className="h-3 w-3 text-muted-foreground" />}
          </Link>
          <span className="text-xs text-muted-foreground mt-0.5">{challenge.description}</span>
        </div>
      </TableCell>
      <TableCell className="w-[120px]">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 gap-1 font-normal w-fit", isComingSoon ? "opacity-50" : "", config.color, "bg-transparent border-current/20")}>
          {config.icon}
          {t(`types.${challenge.type.toLowerCase()}`)}
        </Badge>
      </TableCell>
      <TableCell className="w-[80px]">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", difficultyColors[challenge.difficulty])}>
          {t(`difficulty.${challenge.difficulty}`)}
        </span>
      </TableCell>
      <TableCell className="w-[80px] text-right font-medium text-amber-500 tabular-nums text-xs">
        {isComingSoon ? '-' : <span className="flex items-center justify-end gap-1"><Zap className="h-3 w-3" /> {challenge.xpReward}</span>}
      </TableCell>

      <TableCell className="w-[40px] px-2">
        <Link to="/$locale/challenges/$slug" params={params} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </Link>
      </TableCell>
    </>
  );

  if (isComingSoon) {
    return (
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="opacity-50 cursor-not-allowed hover:bg-transparent border-b transition-colors"
        style={{ display: 'table-row' }}
      >
        {RowContent}
      </motion.tr>
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="group hover:bg-muted/50 transition-colors border-b"
      style={{ display: 'table-row' }}
    >
      {RowContent}
    </motion.tr>
  );
}
