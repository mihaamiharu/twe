import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface ActivityHeatmapProps {
    data: { date: string; count: number }[];
    className?: string;
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
    // Generate dates for the last 365 days
    const { weeks, monthLabels, totalContributions } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = today;
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 364); // 365 days

        // Align to Sunday match GitHub-like grid
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        const dates: Date[] = [];
        const iterator = new Date(startDate);

        while (iterator <= endDate) {
            dates.push(new Date(iterator));
            iterator.setDate(iterator.getDate() + 1);
        }

        const dataMap = new Map<string, number>();
        let total = 0;
        data.forEach(d => {
            dataMap.set(d.date, d.count);
            total += d.count;
        });

        const weeks: { date: Date; count: number }[][] = [];
        let currentWeek: { date: Date; count: number }[] = [];

        dates.forEach((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const count = dataMap.get(dateStr) || 0;
            currentWeek.push({ date, count });

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        // Calculate Month Labels
        const monthLabels: { label: string; weekIndex: number }[] = [];
        weeks.forEach((week, index) => {
            const firstDay = week[0].date;
            if (index === 0) {
                const month = firstDay.toLocaleDateString('en-US', { month: 'short' });
                monthLabels.push({ label: month, weekIndex: index });
            } else {
                const prevWeekFirstDay = weeks[index - 1][0].date;
                const month = firstDay.toLocaleDateString('en-US', { month: 'short' });
                const prevMonth = prevWeekFirstDay.toLocaleDateString('en-US', { month: 'short' });

                if (month !== prevMonth) {
                    monthLabels.push({ label: month, weekIndex: index });
                }
            }
        });

        return { weeks, monthLabels, totalContributions: total };
    }, [data]);

    const getColor = (count: number) => {
        // Emerald for GitHub-like green
        if (count === 0) return "bg-muted/30";
        if (count === 1) return "bg-emerald-200 dark:bg-emerald-900";
        if (count <= 3) return "bg-emerald-400 dark:bg-emerald-700";
        if (count <= 5) return "bg-emerald-600 dark:bg-emerald-500";
        return "bg-emerald-800 dark:bg-emerald-300";
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={cn("w-fit max-w-full border rounded-xl p-4 bg-card overflow-hidden", className)}>
            <div className="mb-4">
                <h3 className="text-base font-semibold">
                    {totalContributions} submissions in the last year
                </h3>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="min-w-[700px] flex flex-col gap-1">
                    {/* Month Labels */}
                    <div className="flex text-xs text-muted-foreground ml-8 relative h-5">
                        {monthLabels.map((m, i) => (
                            <div
                                key={i}
                                className="absolute"
                                style={{ left: `${m.weekIndex * 13}px` }}
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground mr-2 mt-[0px]">
                            {/* Rows correspond to Sun(0), Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6) */}
                            {/* Visual alignment */}
                            <div className="h-[10px] leading-[10px]"></div> {/* Sun */}
                            <div className="h-[10px] leading-[10px] relative top-[1px]">Mon</div>
                            <div className="h-[10px] leading-[10px]"></div> {/* Tue */}
                            <div className="h-[10px] leading-[10px] relative top-[1px]">Wed</div>
                            <div className="h-[10px] leading-[10px]"></div> {/* Thu */}
                            <div className="h-[10px] leading-[10px] relative top-[1px]">Fri</div>
                            <div className="h-[10px] leading-[10px]"></div> {/* Sat */}
                        </div>

                        {/* Grid */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                    {week.map((day) => (
                                        <div key={day.date.toISOString()} className="group relative">
                                            <div
                                                className={cn(
                                                    "w-[10px] h-[10px] rounded-[2px] transition-colors",
                                                    getColor(day.count)
                                                )}
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max px-2 py-1 text-xs text-popover-foreground bg-popover border rounded shadow-md pointer-events-none fade-in-0 zoom-in-95 animate-in duration-200">
                                                <div className="font-medium text-[10px]">{day.count} submissions on {formatDate(day.date)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-[3px]">
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/30" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-600 dark:bg-emerald-500" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-800 dark:bg-emerald-300" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
