/**
 * LevelUpNotification - Animated level up celebration
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getLevelTitle, formatXP } from '@/lib/gamification';
import { Star, Sparkles, X } from 'lucide-react';

export interface LevelUpNotificationProps {
    oldLevel: number;
    newLevel: number;
    totalXP: number;
    onClose: () => void;
    className?: string;
}

export function LevelUpNotification({
    oldLevel,
    newLevel,
    totalXP,
    onClose,
    className,
}: LevelUpNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const newTitle = getLevelTitle(newLevel);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300',
                isVisible ? 'opacity-100' : 'opacity-0',
                className
            )}
            onClick={handleClose}
        >
            <Card
                className={cn(
                    'glass-card border-yellow-500/50 max-w-md w-full mx-4 transform transition-all duration-500',
                    isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <CardContent className="p-8 text-center">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* Sparkle animation */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
                            <Star className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
                            <Star className="h-6 w-6 text-yellow-300 absolute -bottom-1 -left-3 animate-bounce delay-100" />
                        </div>
                    </div>

                    {/* Level up text */}
                    <h2 className="text-2xl font-bold gradient-text mb-2">Level Up!</h2>

                    <div className="flex items-center justify-center gap-4 my-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-muted-foreground">{oldLevel}</div>
                            <div className="text-xs text-muted-foreground">Previous</div>
                        </div>
                        <div className="text-2xl text-muted-foreground">→</div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-primary animate-pulse">{newLevel}</div>
                            <div className="text-xs text-muted-foreground">New Level</div>
                        </div>
                    </div>

                    <p className="text-lg mb-2">
                        You are now a <span className="font-semibold text-yellow-400">{newTitle}</span>!
                    </p>

                    <p className="text-muted-foreground text-sm mb-6">
                        Total XP: {formatXP(totalXP)}
                    </p>

                    <Button onClick={handleClose} className="w-full">
                        Continue
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default LevelUpNotification;
