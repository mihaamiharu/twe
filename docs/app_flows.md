# TestingWithEkki - Application Flows

This document visualizes the key user flows and system interactions for the TestingWithEkki platform.

---

## 1. User Journey Overview

```mermaid
graph TD
    Start[New Visitor] --> Landing[Landing Page]
    Landing --> Browse{Browse Content}
    Browse --> Tutorials[View Tutorials]
    Browse --> Challenges[View Challenges]
    
    Tutorials --> SignUpPrompt1{Want to Track Progress?}
    Challenges --> SignUpPrompt2{Want to Try Challenge?}
    
    SignUpPrompt1 --> SignUp[Sign Up / Login]
    SignUpPrompt2 --> SignUp
    
    SignUp --> Dashboard[User Dashboard]
    Dashboard --> Actions{Choose Action}
    
    Actions --> ReadTutorial[Read Tutorial]
    Actions --> SolveChallenge[Solve Challenge]
    Actions --> ViewProfile[View Profile]
    Actions --> ViewLeaderboard[View Leaderboard]
    
    SolveChallenge --> EarnXP[Earn XP]
    EarnXP --> CheckAchievement{New Achievement?}
    CheckAchievement -->|Yes| ShowBadge[Show Achievement]
    CheckAchievement -->|No| NextChallenge[Next Challenge]
    ShowBadge --> NextChallenge
    
    NextChallenge --> Actions
    ReadTutorial --> Actions
    ViewProfile --> Actions
    ViewLeaderboard --> Actions
```

---

## 2. Challenge Solving Flow (Detailed)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant CodeExecutor
    participant Database
    participant GamificationEngine

    User->>Frontend: Select Challenge
    Frontend->>API: GET /challenges/:slug
    API->>Database: Fetch Challenge & Test Cases
    Database-->>API: Challenge Data
    API-->>Frontend: Challenge + Starter Code
    Frontend-->>User: Display Challenge
    
    User->>Frontend: Write Code in Editor
    Frontend->>Frontend: Auto-save to localStorage
    
    User->>Frontend: Click "Run Tests"
    Frontend->>API: POST /submissions
    API->>CodeExecutor: Execute(code, testCases)
    
    CodeExecutor->>CodeExecutor: Create Sandboxed VM
    CodeExecutor->>CodeExecutor: Run Test Cases
    CodeExecutor-->>API: Execution Results
    
    alt All Tests Passed
        API->>Database: Save Submission (PASSED)
        API->>GamificationEngine: Award XP
        GamificationEngine->>Database: Update User XP
        GamificationEngine->>GamificationEngine: Check Achievements
        GamificationEngine->>Database: Award New Achievements
        GamificationEngine-->>API: XP + Achievements Data
        API-->>Frontend: Success + Rewards
        Frontend-->>User: Show Success + XP Animation
    else Tests Failed
        API->>Database: Save Submission (FAILED)
        API-->>Frontend: Failed Results
        Frontend-->>User: Show Failed Test Cases
    end
```

---

## 3. Authentication Flow

```mermaid
graph TB
    subgraph "Registration Flow"
        RegStart[User Clicks Register] --> RegForm[Fill Registration Form]
        RegForm --> RegValidate{Client Validation}
        RegValidate -->|Invalid| RegError[Show Field Errors]
        RegError --> RegForm
        RegValidate -->|Valid| RegSubmit[POST /auth/register]
        RegSubmit --> RegServer{Server Validation}
        RegServer -->|Email Exists| RegFail[Registration Failed]
        RegServer -->|Success| RegHash[Hash Password]
        RegHash --> RegSave[Create User in DB]
        RegSave --> RegToken[Generate JWT Token]
        RegToken --> RegSuccess[Return User + Token]
        RegSuccess --> RegStore[Store Token in localStorage]
        RegStore --> RegRedirect[Redirect to Dashboard]
    end
    
    subgraph "Login Flow"
        LoginStart[User Clicks Login] --> LoginForm[Fill Login Form]
        LoginForm --> LoginSubmit[POST /auth/login]
        LoginSubmit --> LoginVerify{Verify Credentials}
        LoginVerify -->|Invalid| LoginFail[Login Failed]
        LoginVerify -->|Valid| LoginToken[Generate JWT Token]
        LoginToken --> LoginSuccess[Return User + Token]
        LoginSuccess --> LoginStore[Store Token in localStorage]
        LoginStore --> LoginRedirect[Redirect to Dashboard]
    end
```

---

## 4. Gamification System Flow

```mermaid
graph TD
    Event[Challenge Completed] --> CalculateXP[Calculate XP Reward]
    CalculateXP --> CurrentXP[Get User's Current XP]
    CurrentXP --> AddXP[Add New XP]
    AddXP --> CheckLevel{Level Up?}
    
    CheckLevel -->|Yes| NewLevel[Increment Level]
    CheckLevel -->|No| UpdateXP[Update XP Only]
    
    NewLevel --> LevelAchievement[Check Level Achievements]
    UpdateXP --> CheckAchievements[Check Other Achievements]
    
    LevelAchievement --> AchievementLogic[Achievement Logic]
    CheckAchievements --> AchievementLogic
    
    AchievementLogic --> CheckStreak{Daily Streak?}
    AchievementLogic --> CheckCount{Challenge Count Milestone?}
    AchievementLogic --> CheckCategory{Category Master?}
    
    CheckStreak -->|Yes| AwardStreak[Award Streak Achievement]
    CheckCount -->|Yes| AwardCount[Award Count Achievement]
    CheckCategory -->|Yes| AwardCategory[Award Category Achievement]
    
    AwardStreak --> UpdateLeaderboard[Update Leaderboard]
    AwardCount --> UpdateLeaderboard
    AwardCategory --> UpdateLeaderboard
    CheckStreak -->|No| UpdateLeaderboard
    CheckCount -->|No| UpdateLeaderboard
    CheckCategory -->|No| UpdateLeaderboard
    
    UpdateLeaderboard --> NotifyUser[Notify User of Rewards]
```

---

## 5. System Architecture - Data Flow

```mermaid
graph TB
    subgraph "Client Browser"
        UI[React UI Components]
        Store[Zustand State]
        Editor[Monaco Code Editor]
        Shim[Playwright Shim]
        Iframe[Isolated Iframe]
    end
    
    subgraph "TanStack Start Server"
        ServerFn[Server Functions]
        API[API Routes]
        Auth[BetterAuth]
        Gamification[Gamification Engine]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end
    
    UI --> Store
    Store --> ServerFn
    Editor --> Shim
    Shim --> Iframe
    
    ServerFn --> API
    API --> Auth
    API --> Gamification
    
    Auth --> DB
    Gamification --> DB
    
    style Shim fill:#ff6b6b
    style Iframe fill:#ffd93d
```

---

## 6. Code Execution Security Layers

```mermaid
graph LR
    UserCode[User Code Submission] --> Queue[Submission Queue]
    Queue --> Validator[Input Validator]
    Validator --> Sandbox[VM2 Sandbox]
    
    Sandbox --> Layer1[Layer 1: No require/import]
    Layer1 --> Layer2[Layer 2: No process/fs access]
    Layer2 --> Layer3[Layer 3: 10s Timeout]
    Layer3 --> Layer4[Layer 4: Memory Limit]
    Layer4 --> Execution[Safe Execution]
    
    Execution --> TestRunner[Run Test Cases]
    TestRunner --> Results[Capture Results]
    Results --> Response[Return to User]
    
    style Sandbox fill:#ff6b6b
    style Execution fill:#51cf66
```

---

## 7. Content Management Flow

```mermaid
graph TB
    Admin[Admin/Ekki] --> Create{Create Content}
    
    Create --> Tutorial[New Tutorial]
    Create --> Challenge[New Challenge]
    
    Tutorial --> TutorialMD[Write Markdown]
    TutorialMD --> TutorialMeta[Add Metadata]
    TutorialMeta --> TutorialSave[Save to Database]
    
    Challenge --> ChallengeDesc[Write Description]
    ChallengeDesc --> ChallengeCode[Write Starter Code]
    ChallengeCode --> ChallengeSolution[Write Reference Solution]
    ChallengeSolution --> ChallengeTests[Create Test Cases]
    ChallengeTests --> ChallengeSave[Save to Database]
    
    TutorialSave --> Publish[Publish Content]
    ChallengeSave --> Publish
    
    Publish --> Users[Visible to Users]
```

---

## 8. User Progress Tracking

```mermaid
erDiagram
    USER ||--o{ SUBMISSION : makes
    USER ||--o{ PROGRESS : has
    USER ||--o{ USER_ACHIEVEMENT : earns
    
    CHALLENGE ||--o{ SUBMISSION : receives
    CHALLENGE ||--o{ PROGRESS : tracks
    
    ACHIEVEMENT ||--o{ USER_ACHIEVEMENT : awarded_as
    
    USER {
        uuid id
        int totalXp
        int level
        timestamp lastLoginAt
    }
    
    PROGRESS {
        uuid userId
        uuid challengeId
        enum status
        timestamp completedAt
    }
    
    SUBMISSION {
        uuid userId
        uuid challengeId
        text code
        enum status
        timestamp submittedAt
    }
    
    USER_ACHIEVEMENT {
        uuid userId
        uuid achievementId
        timestamp earnedAt
    }
```

---

## 9. Responsive Layout Structure

```mermaid
flowchart TB
    subgraph Desktop["Desktop Layout"]
        Header[Header: Logo, Nav, User Menu]
        Main[Main Content Area]
        Sidebar[Sidebar: Progress/Stats]
    end
    
    subgraph Mobile["Mobile Layout"]
        MobileHeader[Header: Logo, Hamburger]
        MobileMain[Main Content]
        MobileBottom[Bottom Nav Bar]
    end
    
    subgraph PlayDesktop["Playground - Desktop"]
        PLLeft[Left: Description]
        PLCenter[Center: Code Editor]
        PLRight[Right: Test Results]
    end
    
    subgraph PlayMobile["Playground - Mobile"]
        PLTabs[Tabs: Description, Editor, Results]
    end
```

---

## 10. Achievement Criteria Examples

```mermaid
graph TB
    User[User Action] --> Check{Achievement Check}
    
    Check --> FirstChallenge{First Challenge Completed?}
    FirstChallenge -->|Yes| Award1[Award: First Steps]
    
    Check --> TenChallenges{10 Challenges Completed?}
    TenChallenges -->|Yes| Award2[Award: Getting Warmed Up]
    
    Check --> SevenDayStreak{7-Day Login Streak?}
    SevenDayStreak -->|Yes| Award3[Award: Dedicated Learner]
    
    Check --> APICategory{Completed 5 API Challenges?}
    APICategory -->|Yes| Award4[Award: API Testing Pro]
    
    Check --> PerfectScore{Challenge with 100% First Try?}
    PerfectScore -->|Yes| Award5[Award: Perfect Execution]
    
    Award1 --> Notify[Notify User]
    Award2 --> Notify
    Award3 --> Notify
    Award4 --> Notify
    Award5 --> Notify
```

---

## Notes

These diagrams illustrate the core flows and architecture of the TestingWithEkki platform. They should be referenced during implementation to ensure consistency with the planned design.
