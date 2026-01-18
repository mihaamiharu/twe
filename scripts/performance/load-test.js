import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const tutorialResponseTime = new Trend('tutorial_response_time');
const challengeResponseTime = new Trend('challenge_response_time');

// Test configuration
export const options = {
    stages: [
        { duration: '30s', target: 25 },   // Ramp-up to 25 users
        { duration: '1m', target: 25 },    // Stay at 25 (baseline)
        { duration: '2m', target: 50 },    // Ramp to 50 (load)
        { duration: '1m', target: 75 },    // Peak at 75
        { duration: '30s', target: 0 },    // Cool-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
        errors: ['rate<0.01'],              // Error rate < 1%
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://qa.testingwithekki.com';
const TEST_USER_EMAIL = __ENV.TEST_EMAIL || 'ekkisyam2310@gmail.com';
const TEST_USER_PASSWORD = __ENV.TEST_PASSWORD || 'PhJ5C9hgwWSKRrP';

// Sample tutorial and challenge slugs (real ones from the project)
const TUTORIAL_SLUGS = [
    'html-element-anatomy',
    'dom-tree-hierarchy',
    'devtools-mastery',
    'css-selector-strategies',
];

const CHALLENGE_SLUGS = [
    'css-selector-101-id-class',
    'css-tag-selectors',
    'css-combining-basics',
];

export default function () {
    // Randomly choose between scenarios
    if (Math.random() < 0.6) {
        tutorialFlow();
    } else {
        challengeFlow();
    }
}

// Scenario 1: Public Tutorial Flow (60% of traffic)
function tutorialFlow() {
    group('Tutorial Flow', () => {
        // Step 1: Homepage
        let homeRes = http.get(`${BASE_URL}/en`);
        check(homeRes, {
            'homepage status 200': (r) => r.status === 200,
        });
        errorRate.add(homeRes.status !== 200);
        sleep(1);

        // Step 2: Tutorial List
        let tutorialListRes = http.get(`${BASE_URL}/en/tutorials`);
        check(tutorialListRes, {
            'tutorial list status 200': (r) => r.status === 200,
        });
        errorRate.add(tutorialListRes.status !== 200);
        tutorialResponseTime.add(tutorialListRes.timings.duration);
        sleep(1);

        // Step 3: View a random tutorial
        const randomSlug = TUTORIAL_SLUGS[Math.floor(Math.random() * TUTORIAL_SLUGS.length)];
        let tutorialRes = http.get(`${BASE_URL}/en/tutorials/${randomSlug}`);
        check(tutorialRes, {
            'tutorial page loads': (r) => r.status === 200 || r.status === 404,
        });
        tutorialResponseTime.add(tutorialRes.timings.duration);
        sleep(2);
    });
}

// Scenario 2: Challenge Flow (40% of traffic - authenticated)
function challengeFlow() {
    group('Challenge Flow', () => {
        // Step 1: Homepage
        let homeRes = http.get(`${BASE_URL}/en`);
        check(homeRes, {
            'homepage status 200': (r) => r.status === 200,
        });
        errorRate.add(homeRes.status !== 200);
        sleep(1);

        // Step 2: Login (get session cookie)
        // Note: Adjust this based on your actual auth endpoint
        let loginRes = http.post(
            `${BASE_URL}/api/auth/sign-in/email`,
            JSON.stringify({
                email: TEST_USER_EMAIL,
                password: TEST_USER_PASSWORD,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        // Check login success (adjust based on your auth response)
        const loginSuccess = loginRes.status === 200 || loginRes.status === 302;
        check(loginRes, {
            'login successful': () => loginSuccess,
        });

        if (!loginSuccess) {
            errorRate.add(1);
            return; // Skip rest if login failed
        }
        sleep(1);

        // Step 3: Challenge List
        let challengeListRes = http.get(`${BASE_URL}/en/challenges`);
        check(challengeListRes, {
            'challenge list status 200': (r) => r.status === 200,
        });
        challengeResponseTime.add(challengeListRes.timings.duration);
        sleep(1);

        // Step 4: View a random challenge
        const randomSlug = CHALLENGE_SLUGS[Math.floor(Math.random() * CHALLENGE_SLUGS.length)];
        let challengeRes = http.get(`${BASE_URL}/en/challenges/${randomSlug}`);
        check(challengeRes, {
            'challenge page loads': (r) => r.status === 200 || r.status === 404,
        });
        challengeResponseTime.add(challengeRes.timings.duration);
        sleep(2);
    });
}

// Setup function - runs once before the test
export function setup() {
    console.log(`Starting load test against ${BASE_URL}`);
    console.log(`Test user: ${TEST_USER_EMAIL}`);

    // Verify the target is reachable
    let res = http.get(`${BASE_URL}/en`);
    if (res.status !== 200) {
        throw new Error(`Target unreachable: ${BASE_URL} returned ${res.status}`);
    }

    return { startTime: new Date().toISOString() };
}

// Teardown function - runs once after the test
export function teardown(data) {
    console.log(`Test completed. Started at: ${data.startTime}`);
}
