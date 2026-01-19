import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const BACK_WAVE_INITIAL = "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z";
const BACK_WAVE_MID = "M0,0V56.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,62.47V0Z";

const FRONT_WAVE = "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z";

export const WaveSeparator = () => {
    // Only render on client to avoid SSR hydration issues with Framer Motion path animations
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        // Return a static placeholder during SSR
        return (
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0 transform translate-y-[1px]">
                <svg
                    className="relative block w-[calc(100%+1.3px)] h-[100px] md:h-[150px]"
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <path
                        d={BACK_WAVE_INITIAL}
                        fill="currentColor"
                        className="text-primary/5"
                    />
                    <path
                        d={FRONT_WAVE}
                        fill="currentColor"
                        className="text-muted/30"
                    />
                </svg>
            </div>
        );
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0 transform translate-y-[1px]">
            <svg
                className="relative block w-[calc(100%+1.3px)] h-[100px] md:h-[150px]"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
            >
                {/* Back Wave (Slower, lighter) */}
                <motion.path
                    d={BACK_WAVE_INITIAL}
                    fill="currentColor"
                    className="text-primary/5"
                    initial={{ d: BACK_WAVE_INITIAL }}
                    animate={{
                        d: [
                            BACK_WAVE_INITIAL,
                            BACK_WAVE_MID,
                            BACK_WAVE_INITIAL
                        ]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: "easeInOut"
                    }}
                />

                {/* Front Wave (Main) */}
                <motion.path
                    d={FRONT_WAVE}
                    fill="currentColor"
                    className="text-muted/30"
                    initial={{ y: 0 }}
                    animate={{ y: [0, 5, 0] }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                />
            </svg>
        </div>
    );
};

