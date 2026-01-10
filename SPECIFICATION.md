# QIHB-Quiz - Vocabulary Learning Quiz Application

## 📋 Project Overview

**QIHB-Quiz** is a web-based vocabulary learning platform that allows users to create customized quizzes from vocabulary data files. The application is designed to support multiple languages, with the initial focus on HSK3 Chinese vocabulary learning for Vietnamese speakers.

---

## 🎯 Core Features

### 1. Data Import & Management

#### MVP Version

- Use pre-loaded `files/hsk3.csv` as the default database
- Parse CSV data and store in browser's IndexedDB

#### Future Enhancement

- Allow users to upload custom CSV files
- Support multiple vocabulary sets

### 2. Quiz Database Schema

Each vocabulary entry will be structured as:

```typescript
interface VocabularyEntry {
  id: string; // MD5 hash of "Tiếng Trung" (word)
  word: string; // Tiếng Trung - Chinese characters
  pinyin: string; // Phiên âm - Pronunciation
  type: string; // Từ loại - Word type (Noun, Verb, etc.)
  meaning: string[]; // Tiếng Việt - Array of Vietnamese meanings
  example: string; // Ví dụ - Example sentence in Chinese
  examplePinyin: string; // Chú thích - Example pinyin
  exampleMeaning: string; // Dịch - Vietnamese translation of example
}
```

### 3. Quiz Creation

Users can create new quizzes with 4 length options:

| Option  | Vietnamese Label | Questions |
| ------- | ---------------- | --------- |
| Short   | Ngắn             | 10 câu    |
| Medium  | Trung            | 20 câu    |
| Long    | Dài              | 40 câu    |
| Maximum | Tối đa           | 100 câu   |

### 4. Question Types

#### Type A: Trắc Nghiệm (Multiple Choice)

- **Format**: 6 options (A/B/C/D/E/F)
- **Question Variants**:
  1. Word → Pinyin (Given word, select correct pinyin)
  2. Pinyin → Word (Given pinyin, select correct word)
  3. Meaning → Word (Given meaning, select correct word)
  4. Meaning → Pinyin (Given meaning, select correct pinyin)
  5. Word → Meaning (Given word, select correct meaning)
  6. Pinyin → Meaning (Given pinyin, select correct meaning)
- **Option Selection Logic**: Choose 5 random words with similar character length (±1 character) + 1 correct answer

#### Type B: Nối Từ (Matching)

- **Format**: Match 10 items across 3 columns
- **Columns**: Word | Pinyin | Meaning
- **Interaction**: Drag and drop to connect correct pairs
- **Scoring**: Each correct connection = 1 point (max 10 points per question)

### 5. Frequency Tracking

Track every word appearance during tests:

```typescript
interface FrequencyRecord {
  wordId: string;
  word: string;
  pinyin: string;
  meaning: string[];
  appearances: number; // Total times shown in quiz
  correctAnswers: number; // Times answered correctly
  incorrectAnswers: number; // Times answered incorrectly
  accuracy: number; // Percentage (correctAnswers / appearances)
}
```

### 6. Quiz Navigation & Examination

#### Navigation Elements

- **Trang chủ** (Home) - Return to main menu
- **Tiến** (Next) - Go to next question
- **Lùi** (Back) - View previous answer (read-only)
- **Gửi** (Submit) - Submit current answer

#### Answer Submission Flow

1. User selects/submits answer
2. System displays result: "Đúng" ✅ or "Sai" ❌
3. If incorrect, show correct answer
4. **Show example sentences**: Display "Ví dụ" (example) and "Nghĩa là" (meaning) for each word involved in the question
5. Store question result and timing
6. Auto-advance or manual navigation to next question

#### Example Display After Submission

After submitting an answer, display example sentences below each vocabulary word:

**For Multiple Choice:**

```
[Word/Question]
├── ✅ Correct answer: xuéxí
└── 📝 Ví dụ: 我每天学习汉语
    Nghĩa là: Tôi học tiếng Trung mỗi ngày
```

**For Matching:**
Each row shows example after submission:

```
| 学习 | xuéxí | Học |
└── 📝 Ví dụ: 我每天学习汉语 - Nghĩa là: Tôi học tiếng Trung mỗi ngày
```

### 7. Results Page (Kết Quả)

#### Summary Section

- **Kết quả**: "Đúng X câu, sai Y câu" (Correct X, Wrong Y)
- **Thời gian hoàn thành**: Total time to complete quiz
- **Average time per question type**:
  - Trắc nghiệm average
  - Nối từ average

#### Analytics Table (Phân Tích Kết Quả)

Sorted by: Most appearances → Most incorrect answers

| Word | Pinyin | Meaning | Appearances | Correct | Incorrect | Accuracy |
| ---- | ------ | ------- | ----------- | ------- | --------- | -------- |

---

## 🛠 Technical Architecture

### Tech Stack

| Layer              | Technology               |
| ------------------ | ------------------------ |
| Frontend Framework | React 18 + TypeScript    |
| Styling            | TailwindCSS              |
| State Management   | Zustand                  |
| Storage            | IndexedDB (via Dexie.js) |
| CSV Parsing        | PapaParse                |
| Drag & Drop        | @dnd-kit                 |
| Routing            | React Router v6          |
| Build Tool         | Vite                     |
| Hashing            | crypto-js (MD5)          |

### Project Structure

```
qihb-quiz/
├── files/
│   └── hsk3.csv
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── quiz/
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── MatchingQuestion.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   └── QuizTimer.tsx
│   │   └── results/
│   │       ├── ScoreSummary.tsx
│   │       ├── AnalyticsTable.tsx
│   │       └── TimeStats.tsx
│   ├── hooks/
│   │   ├── useQuiz.ts
│   │   ├── useTimer.ts
│   │   └── useVocabulary.ts
│   ├── lib/
│   │   ├── csvParser.ts
│   │   ├── db.ts
│   │   ├── hashUtils.ts
│   │   └── quizGenerator.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── QuizSetupPage.tsx
│   │   ├── ExamPage.tsx
│   │   └── ResultsPage.tsx
│   ├── stores/
│   │   ├── quizStore.ts
│   │   └── vocabularyStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📱 UI/UX Design

### Color Palette

| Purpose    | Color      | Hex     |
| ---------- | ---------- | ------- |
| Primary    | Deep Coral | #E85A4F |
| Secondary  | Warm Cream | #EAE7DC |
| Accent     | Teal       | #5CA4A9 |
| Success    | Sage Green | #8E8D8A |
| Error      | Soft Red   | #D8C3A5 |
| Background | Off-white  | #F5F5F5 |
| Text       | Charcoal   | #2D3436 |

### Typography

- **Headings**: "Noto Sans SC" (Chinese support) / "Be Vietnam Pro"
- **Body**: "Inter"
- **Pinyin**: "Source Sans Pro"

### Pages Overview

#### 1. Home Page (Trang Chủ)

- App logo and title
- "Tạo bài thi mới" button
- Quick stats (if available)
- Data management section

#### 2. Quiz Setup Page

- Quiz length selection (4 cards)
- Start quiz button
- Preview of question types

#### 3. Exam Page

- Question number indicator
- Timer display
- Question content area
- Navigation controls
- Submit button
- Result feedback overlay

#### 4. Results Page

- Score summary card
- Time statistics
- Analytics table with sorting
- "Làm bài mới" (New quiz) button
- "Xem chi tiết" (View details) for each word

---

## 📊 Data Flow

```
CSV File
    ↓
Parse & Transform (PapaParse)
    ↓
Merge duplicate words (aggregate meanings)
    ↓
Generate IDs (MD5 hash)
    ↓
Store in IndexedDB (Dexie.js)
    ↓
Quiz Generator selects questions
    ↓
Frequency Tracker monitors interactions
    ↓
Results aggregated and displayed
```

---

## 🧪 Question Generation Algorithm

### Multiple Choice Generation

```typescript
function generateMultipleChoice(vocabulary: VocabularyEntry[]): Question {
  // 1. Select random correct answer
  const correct = selectRandom(vocabulary);

  // 2. Get similar-length words for options
  const wordLength = correct.word.length;
  const similarWords = vocabulary.filter(
    (v) => Math.abs(v.word.length - wordLength) <= 1 && v.id !== correct.id
  );

  // 3. Select 5 random distractors
  const distractors = selectRandom(similarWords, 5);

  // 4. Randomly select question variant
  const variant = selectRandomVariant();

  // 5. Shuffle options
  const options = shuffle([correct, ...distractors]);

  return { type: "multiple-choice", correct, options, variant };
}
```

### Matching Question Generation

```typescript
function generateMatching(vocabulary: VocabularyEntry[]): MatchingQuestion {
  // 1. Select 10 random entries
  const selected = selectRandom(vocabulary, 10);

  // 2. Extract and shuffle each column
  const words = shuffle(selected.map((s) => s.word));
  const pinyins = shuffle(selected.map((s) => s.pinyin));
  const meanings = shuffle(selected.map((s) => s.meaning[0]));

  // 3. Create answer key
  const answerKey = selected.map((s) => ({
    word: s.word,
    pinyin: s.pinyin,
    meaning: s.meaning[0],
  }));

  return { type: "matching", words, pinyins, meanings, answerKey };
}
```

---

## 📝 CSV Data Processing

### Raw CSV Structure

```
"Tiếng Trung";"Phiên âm";Từ loại;"Tiếng Việt";Ví dụ;Chú thích;Dịch
```

### Processing Rules

1. **Multi-line entries**: Merge rows where "Tiếng Trung" is empty (continuation of previous entry)
2. **Multiple meanings**: Aggregate into array when same word has different meanings
3. **Multiple pronunciations**: Create separate entries (e.g., 把 bǎ vs 把 bà)
4. **ID Generation**: `MD5(word + pinyin)` for uniqueness

---

## ⏱ Timer Implementation

```typescript
interface TimerState {
  totalTime: number; // Total quiz time in seconds
  questionTimes: {
    questionId: string;
    type: "multiple-choice" | "matching";
    duration: number; // Time spent on this question
  }[];
  currentQuestionStart: number; // Timestamp when question started
}
```

---

## 💾 IndexedDB Schema (Dexie.js)

```typescript
// Database version 1
const db = new Dexie("QIHBQuizDB");

db.version(1).stores({
  vocabulary: "id, word, pinyin, type",
  quizHistory: "++id, date, score, totalQuestions, duration",
  frequencyRecords: "wordId, appearances, correctAnswers",
});
```

---

## 🔄 State Management (Zustand)

### Quiz Store

```typescript
interface QuizState {
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Answer[];
  frequency: Map<string, FrequencyRecord>;
  timer: TimerState;

  // Actions
  startQuiz: (length: QuizLength) => void;
  submitAnswer: (answer: Answer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishQuiz: () => Results;
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Day 1-2)

- [ ] Project setup with Vite + React + TypeScript
- [ ] TailwindCSS configuration
- [ ] IndexedDB setup with Dexie.js
- [ ] CSV parser implementation
- [ ] Type definitions

### Phase 2: Data Layer (Day 2-3)

- [ ] CSV data processing and transformation
- [ ] Vocabulary store implementation
- [ ] Database seeding from hsk3.csv
- [ ] Hash ID generation

### Phase 3: Quiz Engine (Day 3-5)

- [ ] Quiz generator algorithms
- [ ] Multiple choice question component
- [ ] Matching question component (drag & drop)
- [ ] Timer implementation
- [ ] Frequency tracking

### Phase 4: UI/UX (Day 5-7)

- [ ] Home page design
- [ ] Quiz setup page
- [ ] Exam page with navigation
- [ ] Results page with analytics
- [ ] Responsive design

### Phase 5: Polish (Day 7-8)

- [ ] Animations and transitions
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing and bug fixes

---

## 🎨 Wireframes

### Home Page

```
┌─────────────────────────────────────┐
│           QIHB-Quiz                 │
│     🎓 Học từ vựng hiệu quả        │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────┐     │
│    │   📚 Tạo bài thi mới   │     │
│    └─────────────────────────┘     │
│                                     │
│    ┌─────────────────────────┐     │
│    │   📊 Lịch sử làm bài   │     │
│    └─────────────────────────┘     │
│                                     │
│    ┌─────────────────────────┐     │
│    │   ⚙️ Quản lý dữ liệu   │     │
│    └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

### Quiz Setup

```
┌─────────────────────────────────────┐
│  ← Trang chủ    Chọn độ dài bài thi │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  Ngắn   │  │  Trung  │          │
│  │ 10 câu  │  │ 20 câu  │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │   Dài   │  │ Tối đa  │          │
│  │ 40 câu  │  │ 100 câu │          │
│  └─────────┘  └─────────┘          │
│                                     │
│         [ Bắt đầu làm bài ]        │
│                                     │
└─────────────────────────────────────┘
```

### Exam Page (Multiple Choice)

```
┌─────────────────────────────────────┐
│ Trang chủ         Câu 5/20   ⏱ 2:35│
├─────────────────────────────────────┤
│                                     │
│         Chọn phiên âm đúng         │
│                                     │
│              学习                   │
│                                     │
│    ○ A. xuéxí                      │
│    ○ B. xuèxī                      │
│    ○ C. xuēxì                      │
│    ○ D. xúexí                      │
│    ○ E. xuéxì                      │
│    ○ F. xuèxí                      │
│                                     │
├─────────────────────────────────────┤
│   [ Lùi ]              [ Gửi ]     │
└─────────────────────────────────────┘
```

### Exam Page (After Submission - with Example)

```
┌─────────────────────────────────────┐
│ Trang chủ         Câu 5/20   ⏱ 2:35│
├─────────────────────────────────────┤
│                                     │
│         Chọn phiên âm đúng         │
│                                     │
│              学习                   │
│                                     │
│    ✅ A. xuéxí  ← Đáp án đúng      │
│    ○ B. xuèxī                      │
│    ○ C. xuēxì                      │
│    ...                              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📝 Ví dụ: 我每天学习汉语    │   │
│  │    Nghĩa là: Tôi học tiếng  │   │
│  │    Trung mỗi ngày           │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│   [ Lùi ]              [ Tiến ]    │
└─────────────────────────────────────┘
```

### Exam Page (Matching)

```
┌─────────────────────────────────────┐
│ Trang chủ         Câu 8/20   ⏱ 5:12│
├─────────────────────────────────────┤
│         Nối từ với nghĩa đúng      │
│                                     │
│  Từ        Phiên âm      Nghĩa     │
│  ───────   ──────────   ───────    │
│  │学习│    │xuéxí│      │Học│      │
│  │工作│    │gōngzuò│    │Làm việc│ │
│  │吃饭│    │chīfàn│     │Ăn cơm│   │
│  │睡觉│    │shuìjiào│   │Ngủ│      │
│  │...│     │...│        │...│      │
│                                     │
├─────────────────────────────────────┤
│   [ Lùi ]              [ Gửi ]     │
└─────────────────────────────────────┘
```

### Exam Page (Matching - After Submission)

```
┌─────────────────────────────────────┐
│ Trang chủ         Câu 8/20   ⏱ 5:12│
├─────────────────────────────────────┤
│         Nối từ với nghĩa đúng      │
│  Đúng 4/5 cặp                       │
│                                     │
│  Từ        Phiên âm      Nghĩa     │
│  ───────   ──────────   ───────    │
│  ✅│学习│  │xuéxí│      │Học│      │
│    📝 Ví dụ: 我每天学习汉语         │
│       Nghĩa là: Tôi học tiếng Trung │
│                                     │
│  ❌│工作│  │chīfàn│     │Làm việc│ │
│    → Đáp án: gōngzuò - Làm việc    │
│    📝 Ví dụ: 他在公司工作          │
│       Nghĩa là: Anh ấy làm việc... │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│   [ Lùi ]              [ Tiến ]    │
└─────────────────────────────────────┘
```

### Results Page

```
┌─────────────────────────────────────┐
│           Kết quả bài thi          │
├─────────────────────────────────────┤
│                                     │
│    ┌───────────────────────────┐   │
│    │ 🎉 Đúng 15 câu, sai 5 câu │   │
│    │    Thời gian: 8:45        │   │
│    └───────────────────────────┘   │
│                                     │
│    Thống kê thời gian:             │
│    • Trắc nghiệm: TB 25s/câu       │
│    • Nối từ: TB 60s/câu            │
│                                     │
│    Phân tích kết quả:              │
│    ┌────────────────────────────┐  │
│    │ Từ    │ Số câu xuất hiện │ Đúng │ Sai  │  │
│    ├────────────────────────────┤  │
│    │ 学习  │  3  │   2  │   1  │  │
│    │ 工作  │  2  │   1  │   1  │  │
│    │ ...   │ ... │ ...  │ ...  │  │
│    └────────────────────────────┘  │
│                                     │
│         [ Làm bài mới ]            │
└─────────────────────────────────────┘
```

---

## ✅ Acceptance Criteria

1. **Data Import**: CSV file is parsed correctly with all fields mapped
2. **Quiz Generation**: Questions are generated randomly without duplicates
3. **Multiple Choice**: Options have similar word length, 6 choices always shown
4. **Matching**: Drag and drop works smoothly, connections are validated
5. **Timer**: Time is tracked per question and in total
6. **Frequency**: All word appearances are logged accurately
7. **Navigation**: Back button shows read-only previous answers
8. **Results**: Analytics table is sortable and accurate
9. **Persistence**: Quiz data survives page refresh (IndexedDB)
10. **Responsive**: Works on mobile and desktop
11. **Example Display**: After answer submission, example sentences ("Ví dụ" and "Nghĩa là") are shown below each vocabulary word

---

## 🔮 Future Enhancements

1. User accounts and progress sync
2. Spaced repetition algorithm
3. Audio pronunciation
4. Custom vocabulary import
5. Multi-language support
6. Leaderboards
7. Study mode (flashcards)
8. Export/share results
9. Dark mode
10. PWA support for offline use
