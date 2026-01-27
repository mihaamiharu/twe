import { ChallengeSkeleton } from '../ChallengeSkeleton';

export function LoadingOverlay() {
    return (
        <div className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="flex-1">
                <ChallengeSkeleton />
            </div>
        </div>
    );
}
