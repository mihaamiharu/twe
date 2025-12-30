import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/terms')({
    component: TermsPage,
});

function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Terms of Service</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing or using TestingWithEkki, you agree to be bound by these Terms of Service.
                </p>

                <h2>2. Description of Service</h2>
                <p>
                    TestingWithEkki serves as an educational platform for learning software testing automation
                    through interactive challenges and tutorials.
                </p>

                <h2>3. User Accounts</h2>
                <p>
                    You are responsible for maintaining the confidentiality of your account credentials
                    and for all activities that occur under your account.
                </p>

                <h2>4. Code of Conduct</h2>
                <p>
                    Users agree not to cheat on challenges or harass other users on the leaderboard/community features.
                </p>
            </div>
        </div>
    );
}
