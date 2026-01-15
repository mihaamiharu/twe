import { motion, useAnimation, type TargetAndTransition, type Transition } from 'framer-motion';
import React, { useEffect } from 'react';

// Using a spring configuration similar to Josh Comeau's preferences
const springConfig = {
    type: 'spring',
    stiffness: 150,
    damping: 10,
    mass: 0.8,
};

interface BoopProps {
    children: React.ReactNode;
    rotation?: number;
    scale?: number;
    x?: number;
    y?: number;
    timing?: number;
    className?: string;
    config?: Transition;
}

export const Boop = ({
    children,
    rotation = 0,
    scale = 1,
    x = 0,
    y = 0,
    timing = 150,
    className = '',
    config = springConfig,
}: BoopProps) => {
    const [isBooped, setIsBooped] = React.useState(false);

    const style: TargetAndTransition = {
        rotate: isBooped ? rotation : 0,
        scale: isBooped ? scale : 1,
        x: isBooped ? x : 0,
        y: isBooped ? y : 0,
    };

    useEffect(() => {
        if (!isBooped) {
            return;
        }
        const timeoutId = window.setTimeout(() => {
            setIsBooped(false);
        }, timing);
        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [isBooped, timing]);

    const trigger = () => {
        setIsBooped(true);
    };

    return (
        <motion.span
            onMouseEnter={trigger}
            animate={style}
            transition={config}
            className={`inline-block ${className}`}
        >
            {children}
        </motion.span>
    );
};
