# QIHB-Quiz Implementation Plan

## 🗓 Development Timeline

**Estimated Duration**: 8 days
**Start Date**: TBD
**Tech Stack**: React + TypeScript + Vite + TailwindCSS

---

## 📋 Task Breakdown

### Phase 1: Project Setup (Day 1)

#### 1.1 Initialize Project

- [ ] Create Vite + React + TypeScript project
- [ ] Configure TailwindCSS with custom theme
- [ ] Set up project folder structure
- [ ] Configure ESLint and Prettier
- [ ] Install dependencies:
  - `dexie` (IndexedDB wrapper)
  - `papaparse` (CSV parsing)
  - `@dnd-kit/core` (drag and drop)
  - `zustand` (state management)
  - `react-router-dom` (routing)
  - `crypto-js` (MD5 hashing)
  - `lucide-react` (icons)

#### 1.2 Configure Theme

- [ ] Set up TailwindCSS color palette
- [ ] Configure typography (Noto Sans SC, Be Vietnam Pro)
- [ ] Create base component styles

#### 1.3 Create Base Components

- [ ] Button component (primary, secondary, ghost variants)
- [ ] Card component
- [ ] Navigation component
- [ ] Layout wrapper

---

### Phase 2: Data Layer (Day 2)

#### 2.1 Type Definitions

- [ ] Create `types/index.ts` with all interfaces:
  ```typescript
  VocabularyEntry;
  Quiz;
  Question;
  MultipleChoiceQuestion;
  MatchingQuestion;
  Answer;
  FrequencyRecord;
  QuizResult;
  TimerState;
  ```

#### 2.2 Database Setup

- [ ] Create Dexie database schema (`lib/db.ts`)
- [ ] Define tables: vocabulary, quizHistory, frequencyRecords
- [ ] Create database initialization function

#### 2.3 CSV Parser

- [ ] Create `lib/csvParser.ts`
- [ ] Implement CSV parsing logic with PapaParse
- [ ] Handle multi-line entries (merge rows)
- [ ] Aggregate multiple meanings for same word
- [ ] Handle multiple pronunciations (create separate entries)
- [ ] Generate MD5 hash IDs

#### 2.4 Vocabulary Store

- [ ] Create `stores/vocabularyStore.ts` with Zustand
- [ ] Implement actions:
  - `loadFromCSV()`
  - `getByLength(length: number)`
  - `getByType(type: string)`
  - `getRandomWords(count: number)`

---

### Phase 3: Quiz Engine (Days 3-4)

#### 3.1 Quiz Generator

- [ ] Create `lib/quizGenerator.ts`
- [ ] Implement `generateMultipleChoice()`:
  - Select correct answer
  - Find similar-length words for distractors
  - Randomly select question variant (6 types)
  - Shuffle options
- [ ] Implement `generateMatching()`:
  - Select 10 random entries
  - Extract and shuffle columns
  - Create answer key
- [ ] Implement `generateQuiz(length: QuizLength)`:
  - Mix multiple choice and matching questions
  - Ensure no duplicate words in adjacent questions

#### 3.2 Quiz Store

- [ ] Create `stores/quizStore.ts` with Zustand
- [ ] State:
  - `currentQuiz`
  - `currentQuestionIndex`
  - `answers[]`
  - `frequency Map`
  - `timer`
- [ ] Actions:
  - `startQuiz(length)`
  - `submitAnswer(answer)`
  - `nextQuestion()`
  - `previousQuestion()`
  - `finishQuiz()`
  - `resetQuiz()`

#### 3.3 Timer Implementation

- [ ] Create `hooks/useTimer.ts`
- [ ] Track total elapsed time
- [ ] Track per-question time
- [ ] Pause/resume functionality
- [ ] Calculate averages by question type

#### 3.4 Frequency Tracker

- [ ] Implement frequency tracking in quiz store
- [ ] Track word appearances
- [ ] Track correct/incorrect answers
- [ ] Calculate accuracy percentages

---

### Phase 4: Question Components (Day 5)

#### 4.1 Multiple Choice Component

- [ ] Create `components/quiz/MultipleChoice.tsx`
- [ ] Display question based on variant type
- [ ] Show 6 options (A-F)
- [ ] Handle option selection
- [ ] Show result feedback (correct/incorrect)
- [ ] Display correct answer when wrong
- [ ] **Show example sentence after submission**: Display "Ví dụ" (example) and "Nghĩa là" (meaning) below the question word

#### 4.2 Matching Component

- [ ] Create `components/quiz/MatchingQuestion.tsx`
- [ ] Set up @dnd-kit context
- [ ] Create draggable items for words, pinyins, meanings
- [ ] Create droppable zones
- [ ] Implement connection lines between matches
- [ ] Validate connections on submit
- [ ] Show feedback for each connection
- [ ] **Show example sentence for each word row after submission**: Display "Ví dụ" and "Nghĩa là" below each matched row

#### 4.3 Question Wrapper

- [ ] Create `components/quiz/QuestionCard.tsx`
- [ ] Handle question type routing
- [ ] Display question number and total
- [ ] Show timer
- [ ] Handle submit logic

---

### Phase 5: Pages (Days 6-7)

#### 5.1 Home Page

- [ ] Create `pages/HomePage.tsx`
- [ ] App title and branding
- [ ] "Tạo bài thi mới" button
- [ ] Quick stats section (if quiz history exists)
- [ ] Data management link
- [ ] Initialize vocabulary on first load

#### 5.2 Quiz Setup Page

- [ ] Create `pages/QuizSetupPage.tsx`
- [ ] Display 4 quiz length options as cards
- [ ] Highlight selected option
- [ ] "Bắt đầu làm bài" button
- [ ] Navigate to exam page on start

#### 5.3 Exam Page

- [ ] Create `pages/ExamPage.tsx`
- [ ] Navigation bar with home, progress, timer
- [ ] Question content area
- [ ] Navigation controls (Lùi, Tiến, Gửi)
- [ ] Result overlay (Đúng/Sai)
- [ ] Auto-redirect to results when complete

#### 5.4 Results Page

- [ ] Create `pages/ResultsPage.tsx`
- [ ] Score summary card
- [ ] Time statistics section
- [ ] Analytics table with sorting
- [ ] "Làm bài mới" button
- [ ] Save quiz history to IndexedDB

---

### Phase 6: Routing & Integration (Day 7)

#### 6.1 Router Setup

- [ ] Configure React Router
- [ ] Define routes:
  - `/` - Home
  - `/setup` - Quiz Setup
  - `/exam` - Exam Page
  - `/results` - Results Page

#### 6.2 Integration Testing

- [ ] Test complete quiz flow
- [ ] Verify data persistence
- [ ] Test navigation edge cases
- [ ] Test timer accuracy
- [ ] Verify frequency tracking

---

### Phase 7: Polish & Optimization (Day 8)

#### 7.1 Animations

- [ ] Page transitions
- [ ] Button hover effects
- [ ] Option selection animations
- [ ] Result reveal animations
- [ ] Matching connection animations

#### 7.2 Error Handling

- [ ] Handle empty database
- [ ] Handle insufficient words for quiz
- [ ] Handle browser without IndexedDB
- [ ] Add error boundaries

#### 7.3 Performance

- [ ] Optimize re-renders
- [ ] Lazy load pages
- [ ] Memoize expensive calculations
- [ ] Test on mobile devices

#### 7.4 Responsive Design

- [ ] Test on mobile (320px - 480px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (1024px+)
- [ ] Adjust matching component for touch

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
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/papaparse": "^5.3.14",
    "@types/crypto-js": "^4.2.1",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "eslint": "^8.55.0"
  }
}
```

---

## 📁 Folder Structure Creation Order

```bash
1. mkdir -p src/components/common
2. mkdir -p src/components/quiz
3. mkdir -p src/components/results
4. mkdir -p src/hooks
5. mkdir -p src/lib
6. mkdir -p src/pages
7. mkdir -p src/stores
8. mkdir -p src/types
```

---

## 🎯 Milestones

| Milestone | Target | Deliverable                     |
| --------- | ------ | ------------------------------- |
| M1        | Day 2  | Data layer complete, CSV parsed |
| M2        | Day 4  | Quiz generation working         |
| M3        | Day 5  | Question components functional  |
| M4        | Day 7  | Full quiz flow complete         |
| M5        | Day 8  | Production ready                |

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] CSV parser handles edge cases
- [ ] Hash generation is consistent
- [ ] Quiz generator creates valid questions
- [ ] Timer calculates correctly
- [ ] Frequency tracker updates properly

### Integration Tests

- [ ] Full quiz flow (start to results)
- [ ] Navigation works correctly
- [ ] Data persists after refresh
- [ ] Results calculation accurate

### Manual Tests

- [ ] Multiple choice all 6 variants
- [ ] Matching drag and drop
- [ ] Mobile touch interactions
- [ ] Timer display accuracy
- [ ] Analytics table sorting
- [ ] Example sentences display correctly after MC submission
- [ ] Example sentences display correctly after Matching submission
- [ ] Example sentences show for words with empty examples (graceful handling)

---

## 📝 Notes

### CSV Edge Cases to Handle

1. Multi-line cells (example sentences)
2. Empty cells (some words don't have examples)
3. Multiple meanings in same row (separated by newlines)
4. Multiple pronunciations (把 has bǎ and bà)
5. Encoding issues (UTF-8 with BOM)

### Matching Question Considerations

1. Need minimum 10 unique words
2. All 10 items must be connected
3. Show visual feedback for connections
4. Handle touch on mobile
5. Clear existing connections on retry

### Example Sentence Display Feature

1. After submitting an answer, display example sentence ("Ví dụ") and its meaning ("Nghĩa là")
2. For Multiple Choice: Show example below the question word
3. For Matching: Show example below each word row after submission
4. Handle empty examples gracefully (some words may not have examples)
5. Style with distinct visual treatment (e.g., light background, book icon 📝)
6. Data required: `example` (Chinese sentence) and `exampleMeaning` (Vietnamese translation) from VocabularyEntry

### Performance Targets

- Initial load: < 2s
- Question generation: < 100ms
- Smooth 60fps animations
- IndexedDB operations: < 50ms

---

## 🚀 Commands to Start

```bash
# Create project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install react-router-dom zustand dexie papaparse @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities crypto-js lucide-react

# Install dev dependencies
npm install -D @types/papaparse @types/crypto-js tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Start development
npm run dev
```
