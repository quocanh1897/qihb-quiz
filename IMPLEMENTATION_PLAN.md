# QIHB-Quiz Implementation Plan

## 🗓 Development Timeline

**Estimated Duration**: 8 days
**Status**: ✅ Complete
**Tech Stack**: React + TypeScript + Vite + TailwindCSS

---

## 📋 Task Breakdown

### Phase 1: Project Setup (Day 1) ✅

#### 1.1 Initialize Project

- [x] Create Vite + React + TypeScript project
- [x] Configure TailwindCSS with custom theme
- [x] Set up project folder structure
- [x] Install dependencies:
  - `dexie` (IndexedDB wrapper)
  - `papaparse` (CSV parsing)
  - `@dnd-kit/core` (drag and drop)
  - `zustand` (state management)
  - `react-router-dom` (routing)
  - `crypto-js` (MD5 hashing)
  - `lucide-react` (icons)

#### 1.2 Configure Theme

- [x] Set up TailwindCSS color palette
- [x] Configure typography (Noto Sans SC, Be Vietnam Pro, Source Sans 3)
- [x] Create base component styles
- [x] Add custom animations

#### 1.3 Create Base Components

- [x] Button component (primary, secondary, ghost variants)
- [x] Card component
- [x] Navigation component
- [x] Layout wrapper
- [x] ProgressBar component
- [x] SpeakerButton component (text-to-speech)

---

### Phase 2: Data Layer (Day 2) ✅

#### 2.1 Type Definitions

- [x] Create `types/index.ts` with all interfaces:
  ```typescript
  VocabularyEntry;
  Quiz;
  Question;
  MultipleChoiceQuestion;
  FillBlankQuestion;
  MatchingQuestion;
  Answer;
  FrequencyRecord;
  GlobalWordStats;
  QuizHistory;
  QuizResult;
  TimerState;
  ```

#### 2.2 Database Setup

- [x] Create Dexie database schema (`lib/db.ts`)
- [x] Define tables: vocabulary, quizHistory, globalWordStats
- [x] Create database initialization function
- [x] Add helper functions for CRUD operations

#### 2.3 CSV Parser

- [x] Create `lib/csvParser.ts`
- [x] Implement CSV parsing logic with PapaParse
- [x] Handle multi-line entries (merge rows)
- [x] Aggregate multiple meanings for same word
- [x] Handle multiple pronunciations (create separate entries)
- [x] Generate MD5 hash IDs

#### 2.4 Vocabulary Store

- [x] Create `stores/vocabularyStore.ts` with Zustand
- [x] Implement actions:
  - `loadFromCSV()`
  - `getByLength(length: number)`
  - `getRandomWords(count: number)`

---

### Phase 3: Quiz Engine (Days 3-4) ✅

#### 3.1 Quiz Generator

- [x] Create `lib/quizGenerator.ts`
- [x] Implement `generateMultipleChoice()`:
  - Select correct answer
  - Find similar-length words for distractors
  - Randomly select question variant (6 types)
  - Shuffle options
- [x] Implement `generateFillBlank()`:
  - Select words with example sentences
  - Create sentence with blank
  - Find similar-length distractors
- [x] Implement `generateMatching()`:
  - Select 3-6 random entries
  - Extract and shuffle columns
  - Create answer key
- [x] Implement `generateQuiz(length: QuizLength)`:
  - Mix all three question types
  - Ensure no duplicate words in adjacent questions
  - Guarantee at least one of each question type

#### 3.2 Quiz Store

- [x] Create `stores/quizStore.ts` with Zustand
- [x] State:
  - `currentQuiz`
  - `currentQuestionIndex`
  - `answers[]`
  - `frequency Map`
  - `timer`
- [x] Actions:
  - `startQuiz(length)`
  - `submitAnswer(answer)`
  - `nextQuestion()`
  - `previousQuestion()`
  - `finishQuiz()`
  - `resetQuiz()`

#### 3.3 Timer Implementation

- [x] Create `hooks/useTimer.ts`
- [x] Track total elapsed time
- [x] Track per-question time
- [x] Calculate averages by question type
- [x] Format time display utility

#### 3.4 Frequency Tracker

- [x] Implement frequency tracking in quiz store
- [x] Track word appearances
- [x] Track correct/incorrect answers
- [x] Calculate accuracy percentages
- [x] Update global stats after quiz completion

---

### Phase 4: Question Components (Day 5) ✅

#### 4.1 Multiple Choice Component

- [x] Create `components/quiz/MultipleChoice.tsx`
- [x] Display question based on variant type
- [x] Show 6 options (A-F)
- [x] Handle option selection
- [x] Show result feedback (correct/incorrect)
- [x] Display correct answer when wrong
- [x] Show example sentence after submission

#### 4.2 Fill in the Blank Component

- [x] Create `components/quiz/FillBlankQuestion.tsx`
- [x] Display sentence with blank
- [x] Show 6 word options
- [x] Handle option selection
- [x] Show result feedback
- [x] Display pinyin and translation after answer

#### 4.3 Matching Component

- [x] Create `components/quiz/MatchingQuestion.tsx`
- [x] Set up @dnd-kit context
- [x] Create draggable items for words, pinyins, meanings
- [x] Create droppable zones
- [x] Implement row-based drag and drop
- [x] Validate connections on submit
- [x] Show feedback for each connection
- [x] Show example sentences after submission

#### 4.4 Question Wrapper

- [x] Create `components/quiz/QuestionCard.tsx`
- [x] Handle question type routing
- [x] Display question number and total
- [x] Show timer
- [x] Handle submit logic

---

### Phase 5: Pages (Days 6-7) ✅

#### 5.1 Home Page

- [x] Create `pages/HomePage.tsx`
- [x] App title and branding
- [x] "Tạo bài thi mới" button
- [x] "Xem thống kê" button
- [x] Vocabulary count display
- [x] Data management section
- [x] Initialize vocabulary on first load

#### 5.2 Quiz Setup Page

- [x] Create `pages/QuizSetupPage.tsx`
- [x] Display 4 quiz length options as cards
- [x] Highlight selected option
- [x] "Bắt đầu làm bài" button
- [x] Navigate to exam page on start

#### 5.3 Exam Page

- [x] Create `pages/ExamPage.tsx`
- [x] Navigation bar with home, progress, timer
- [x] Question content area (MC, Fill-blank, Matching)
- [x] Navigation controls (Lùi, Tiến, Gửi)
- [x] Result overlay (Đúng/Sai)
- [x] Auto-redirect to results when complete

#### 5.4 Results Page

- [x] Create `pages/ResultsPage.tsx`
- [x] Score summary card
- [x] Time statistics section
- [x] Analytics table with sorting
- [x] "Làm bài mới" button
- [x] Save quiz history to IndexedDB
- [x] Update global word stats

#### 5.5 Profile Page

- [x] Create `pages/ProfilePage.tsx`
- [x] Summary statistics (total quizzes, average score, average time)
- [x] Top 5 words to review section
- [x] Full learning progress table (expandable)
- [x] Quiz history list with expandable details
- [x] Delete functionality (individual entries and full clear)
- [x] Interactive word buttons with detail popup
- [x] Word detail popup with full vocabulary info

---

### Phase 6: Routing & Integration (Day 7) ✅

#### 6.1 Router Setup

- [x] Configure React Router
- [x] Define routes:
  - `/` - Home
  - `/setup` - Quiz Setup
  - `/exam` - Exam Page
  - `/results` - Results Page
  - `/profile` - Profile/Statistics Page

#### 6.2 Integration Testing

- [x] Test complete quiz flow
- [x] Verify data persistence
- [x] Test navigation edge cases
- [x] Test timer accuracy
- [x] Verify frequency tracking

---

### Phase 7: Polish & Optimization (Day 8) ✅

#### 7.1 Animations

- [x] Page transitions
- [x] Button hover effects
- [x] Option selection animations
- [x] Result reveal animations
- [x] Matching connection animations

#### 7.2 Error Handling

- [x] Handle empty database
- [x] Handle insufficient words for quiz
- [x] Graceful fallbacks

#### 7.3 Performance

- [x] Optimize re-renders with useCallback
- [x] Memoize expensive calculations
- [x] Efficient database operations

#### 7.4 Responsive Design

- [x] Mobile-friendly layouts
- [x] Touch support for drag and drop
- [x] Adaptive typography

---

### Phase 8: Testing & Deployment ✅

#### 8.1 End-to-End Tests

- [x] Create Playwright tests
- [x] Test home page navigation
- [x] Test quiz setup flow
- [x] Test multiple choice questions
- [x] Test fill in the blank questions
- [x] Test matching questions
- [x] Test all question types in one quiz
- [x] Test profile page and statistics

#### 8.2 Docker Deployment

- [x] Create Dockerfile (multi-stage build)
- [x] Create docker-compose.yml
- [x] Configure nginx for production
- [x] Document deployment process

---

## 🔧 Dependencies List

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "dexie": "^3.2.4",
    "papaparse": "^5.4.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "crypto-js": "^4.2.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/papaparse": "^5.3.14",
    "@types/crypto-js": "^4.2.1",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

## 📁 Final Project Structure

```
qihb-quiz/
├── files/
│   └── hsk3.csv              # Source vocabulary data
├── public/
│   └── files/
│       └── hsk3.csv          # Production vocabulary data
├── src/
│   ├── components/
│   │   ├── common/           # Button, Card, Layout, Navigation, ProgressBar, SpeakerButton
│   │   ├── quiz/             # MultipleChoice, FillBlankQuestion, MatchingQuestion, QuestionCard, QuizTimer
│   │   └── results/          # ScoreSummary, AnalyticsTable, TimeStats
│   ├── config/               # Quiz configuration
│   ├── hooks/                # useTimer
│   ├── lib/                  # csvParser, db, hashUtils, quizGenerator
│   ├── pages/                # HomePage, QuizSetupPage, ExamPage, ResultsPage, ProfilePage
│   ├── stores/               # quizStore, vocabularyStore
│   └── types/                # TypeScript interfaces
├── tests/                    # Playwright E2E tests
├── Dockerfile                # Docker build config
├── docker-compose.yml        # Docker Compose setup
├── nginx.conf                # nginx configuration
├── SPECIFICATION.md          # Feature specification
├── IMPLEMENTATION_PLAN.md    # This file
└── README.md                 # Project documentation
```

---

## 🎯 Milestones - All Complete ✅

| Milestone | Target | Deliverable                     | Status |
| --------- | ------ | ------------------------------- | ------ |
| M1        | Day 2  | Data layer complete, CSV parsed | ✅     |
| M2        | Day 4  | Quiz generation working         | ✅     |
| M3        | Day 5  | Question components functional  | ✅     |
| M4        | Day 7  | Full quiz flow complete         | ✅     |
| M5        | Day 8  | Production ready                | ✅     |

---

## 🧪 Testing Checklist - All Complete ✅

### E2E Tests (Playwright)

- [x] Home page loads correctly
- [x] Quiz setup navigation works
- [x] Multiple choice questions work
- [x] Fill in the blank questions work
- [x] Matching questions work
- [x] All question types appear in quiz
- [x] Profile page displays correctly
- [x] Navigation between pages works

### Manual Tests

- [x] Multiple choice all 6 variants
- [x] Fill in the blank with various sentences
- [x] Matching drag and drop
- [x] Mobile touch interactions
- [x] Timer display accuracy
- [x] Analytics table sorting
- [x] Example sentences display after submission
- [x] Word detail popup on profile page

---

## 🐳 Deployment Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview

# Docker deployment
docker-compose up -d

# Run tests
npm run test
npm run test:ui
```

---

## 📝 Notes

### Features Implemented

1. **Three Question Types**: Multiple choice, fill-in-blank, and matching
2. **Adaptive Difficulty**: Similar-length word distractors
3. **Global Progress Tracking**: +2 for correct, -3 for incorrect
4. **Text-to-Speech**: Web Speech API for pronunciation
5. **Interactive Word Cards**: Click to see full details
6. **Persistent Storage**: IndexedDB for all data
7. **Docker Ready**: Easy deployment with docker-compose

### Known Considerations

1. Web Speech API requires browser support
2. IndexedDB may not work in private browsing
3. Matching drag and drop optimized for both mouse and touch
4. CSV must follow specific format for parsing
