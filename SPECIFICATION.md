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

#### Type B: Điền Ô Trống (Fill in the Blank)

- **Format**: Example sentence with blank, 6 word options
- **Display**: Shows Chinese sentence with the target word replaced by "\_\_\_"
- **Options**: 5 similar-length words as distractors + 1 correct answer
- **After Answer**: Shows pinyin of correct word and Vietnamese translation of sentence

#### Type C: Nối Từ (Matching)

- **Format**: Match 3-6 items across 3 columns
- **Columns**: Word | Pinyin | Meaning
- **Interaction**: Drag and drop to connect correct pairs
- **Scoring**: Each correct connection = 1 point

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

### 6. Global Learning Progress

Track learning progress across all quizzes:

```typescript
interface GlobalWordStats {
  wordId: string;
  word: string;
  pinyin: string;
  meaning: string[];
  totalAppearances: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  progressScore: number; // Weighted score: +2 for correct, -3 for incorrect
  lastSeen: Date;
}
```

### 7. Quiz Navigation & Examination

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

### 8. Results Page (Kết Quả)

#### Summary Section

- **Kết quả**: "Đúng X câu, sai Y câu" (Correct X, Wrong Y)
- **Thời gian hoàn thành**: Total time to complete quiz
- **Average time per question type**:
  - Trắc nghiệm average
  - Điền ô trống average
  - Nối từ average

#### Analytics Table (Phân Tích Kết Quả)

Sorted by: Most appearances → Most incorrect answers

| Word | Pinyin | Meaning | Appearances | Correct | Incorrect | Accuracy |
| ---- | ------ | ------- | ----------- | ------- | --------- | -------- |

### 9. Profile Page (Thống Kê Học Tập)

#### Features

- **Global Learning Statistics**: Overview of all-time quiz performance
- **Top 5 Words to Review**: Words with lowest progress scores
- **Full Learning Progress Table**: All encountered words with stats
- **Quiz History**: List of past quizzes with expandable details
- **Interactive Word Cards**: Click any word to view details

#### Word Detail Popup

When clicking on any word in the profile page, a popup displays:

```
┌─────────────────────────────────────┐
│  学习                    🔊 [X]     │
├─────────────────────────────────────┤
│  Phiên âm: xuéxí                    │
│  Từ loại: Động từ                   │
│  Nghĩa: Học, Học tập                │
│                                     │
│  Ví dụ: 我每天学习汉语              │
│  (wǒ měitiān xuéxí hànyǔ)          │
│  Nghĩa ví dụ: Tôi học tiếng Trung   │
│               mỗi ngày              │
└─────────────────────────────────────┘
```

#### Clickable Words

All word occurrences in the profile page are clickable buttons:

- Visually distinct with colored background and border
- Hover effects to indicate interactivity
- Click to open word detail popup

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
| Testing            | Playwright               |
| Hashing            | crypto-js (MD5)          |
| Production Server  | nginx (Docker)           |

### Project Structure

```
qihb-quiz/
├── files/
│   └── hsk3.csv
├── public/
│   └── files/
│       └── hsk3.csv
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── SpeakerButton.tsx
│   │   ├── quiz/
│   │   │   ├── FillBlankQuestion.tsx
│   │   │   ├── MatchingQuestion.tsx
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   └── QuizTimer.tsx
│   │   └── results/
│   │       ├── AnalyticsTable.tsx
│   │       ├── ScoreSummary.tsx
│   │       └── TimeStats.tsx
│   ├── config/
│   │   ├── index.ts
│   │   └── quiz.config.json
│   ├── hooks/
│   │   └── useTimer.ts
│   ├── lib/
│   │   ├── csvParser.ts
│   │   ├── db.ts
│   │   ├── hashUtils.ts
│   │   └── quizGenerator.ts
│   ├── pages/
│   │   ├── ExamPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── QuizSetupPage.tsx
│   │   └── ResultsPage.tsx
│   ├── stores/
│   │   ├── quizStore.ts
│   │   └── vocabularyStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tests/
│   ├── all-question-types.spec.ts
│   ├── exam.spec.ts
│   ├── fill-blank.spec.ts
│   ├── history.spec.ts
│   ├── home.spec.ts
│   ├── matching.spec.ts
│   └── quiz-setup.spec.ts
├── Dockerfile
├── docker-compose.yml
├── index.html
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
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
| Success    | Sage Green | #567D58 |
| Warning    | Gold       | #ECB004 |
| Error      | Red        | #EF4444 |
| Background | Off-white  | #F5F5F5 |
| Text       | Charcoal   | #2D3436 |

### Typography

- **Headings**: "Noto Sans SC" (Chinese support) / "Be Vietnam Pro"
- **Body**: "Be Vietnam Pro"
- **Pinyin**: "Source Sans 3"

### Pages Overview

#### 1. Home Page (Trang Chủ)

- App logo and title
- Vocabulary count display
- "Tạo bài thi mới" button
- "Xem thống kê" button
- Data management section

#### 2. Quiz Setup Page

- Quiz length selection (4 cards)
- Start quiz button
- Preview of question types

#### 3. Exam Page

- Question number indicator
- Timer display
- Question content area (MC, Fill-blank, or Matching)
- Navigation controls
- Submit button
- Result feedback overlay

#### 4. Results Page

- Score summary card
- Time statistics
- Analytics table with sorting
- "Làm bài mới" (New quiz) button

#### 5. Profile Page (Thống Kê Học Tập)

- Back navigation button
- Summary statistics card
- Top 5 words to review section
- Full learning progress table (expandable)
- Quiz history list (expandable entries)
- Delete options for data management
- Word detail popup on click

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
Global Stats updated after each quiz
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

### Fill in the Blank Generation

```typescript
function generateFillBlank(vocabulary: VocabularyEntry[]): Question {
  // 1. Select random word WITH example sentence
  const wordsWithExamples = vocabulary.filter(
    (v) => v.example && v.example.includes(v.word)
  );
  const correct = selectRandom(wordsWithExamples);

  // 2. Create sentence with blank
  const sentenceWithBlank = correct.example.replace(correct.word, "___");

  // 3. Get similar-length words for options
  const wordLength = correct.word.length;
  const similarWords = vocabulary.filter(
    (v) => Math.abs(v.word.length - wordLength) <= 1 && v.id !== correct.id
  );

  // 4. Select 5 random distractors
  const distractors = selectRandom(similarWords, 5);

  // 5. Shuffle options
  const options = shuffle([correct, ...distractors]);

  return { type: "fill-blank", correct, options, sentence: sentenceWithBlank };
}
```

### Matching Question Generation

```typescript
function generateMatching(vocabulary: VocabularyEntry[]): MatchingQuestion {
  // 1. Select 3-6 random entries
  const count = randomBetween(3, 6);
  const selected = selectRandom(vocabulary, count);

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
    type: "multiple-choice" | "fill-blank" | "matching";
    duration: number; // Time spent on this question
  }[];
  currentQuestionStart: number; // Timestamp when question started
}
```

---

## 💾 IndexedDB Schema (Dexie.js)

```typescript
const db = new Dexie("QIHBQuizDB");

db.version(3).stores({
  vocabulary: "id, word, pinyin, type",
  quizHistory: "++id, date, score, totalQuestions, duration",
  globalWordStats: "wordId, word, pinyin, progressScore, lastSeen",
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

## 🛤 Application Routes

| Path       | Component     | Description                   |
| ---------- | ------------- | ----------------------------- |
| `/`        | HomePage      | Landing page with navigation  |
| `/setup`   | QuizSetupPage | Quiz configuration            |
| `/exam`    | ExamPage      | Quiz taking interface         |
| `/results` | ResultsPage   | Quiz results and analytics    |
| `/profile` | ProfilePage   | Learning statistics & history |

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
│    │   📊 Xem thống kê      │     │
│    └─────────────────────────┘     │
│                                     │
│    ┌─────────────────────────┐     │
│    │   ⚙️ Quản lý dữ liệu   │     │
│    └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

### Profile Page (Thống Kê Học Tập)

```
┌─────────────────────────────────────┐
│ ← Quay lại    📊 Thống kê học tập  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Tổng số bài thi: 15         │   │
│  │ TB tỷ lệ đúng: 78%          │   │
│  │ TB thời gian: 5:30          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Top 5 từ cần ôn tập:           │
│  ┌─────────────────────────────┐   │
│  │ [学习] [工作] [明天] ...    │   │
│  └─────────────────────────────┘   │
│                                     │
│  📖 Thống kê tiến độ học tập:      │
│  ┌────────────────────────────┐   │
│  │ Từ   │ Đúng │ Sai │ Điểm  │   │
│  ├────────────────────────────┤   │
│  │[学习]│  5   │  2  │  +4   │   │
│  │[工作]│  3   │  3  │  -3   │   │
│  │ ...  │ ...  │ ... │ ...   │   │
│  └────────────────────────────┘   │
│                                     │
│  📋 Lịch sử làm bài:               │
│  ┌─────────────────────────────┐   │
│  │ ▼ 10/01/2026 - 8/10 đúng   │   │
│  │ ▶ 09/01/2026 - 15/20 đúng  │   │
│  │ ▶ 08/01/2026 - 35/40 đúng  │   │
│  └─────────────────────────────┘   │
│                                     │
│         [🗑️ Xóa toàn bộ]          │
│                                     │
└─────────────────────────────────────┘
```

### Word Detail Popup

```
┌─────────────────────────────────────┐
│                              [X]    │
│     学习                🔊          │
│                                     │
│  Phiên âm: xuéxí                    │
│  Từ loại: Động từ                   │
│  Nghĩa: Học, Học tập                │
│  ───────────────────────────────    │
│  Ví dụ: 我每天学习汉语              │
│         wǒ měitiān xuéxí hànyǔ     │
│  Nghĩa ví dụ:                       │
│         Tôi học tiếng Trung mỗi ngày│
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Acceptance Criteria

1. **Data Import**: CSV file is parsed correctly with all fields mapped
2. **Quiz Generation**: Questions are generated randomly without duplicates
3. **Multiple Choice**: Options have similar word length, 6 choices always shown
4. **Fill in Blank**: Sentences display correctly with blank, answer reveals translation
5. **Matching**: Drag and drop works smoothly, connections are validated
6. **Timer**: Time is tracked per question and in total
7. **Frequency**: All word appearances are logged accurately
8. **Global Stats**: Progress scores update correctly (+2 correct, -3 incorrect)
9. **Navigation**: Back button shows read-only previous answers
10. **Results**: Analytics table is sortable and accurate
11. **Profile Page**: Shows learning progress and quiz history
12. **Word Popup**: Clicking words shows full vocabulary details
13. **Persistence**: Quiz data survives page refresh (IndexedDB)
14. **Responsive**: Works on mobile and desktop
15. **Example Display**: After answer submission, example sentences are shown

---

## 🐳 Docker Deployment

### Dockerfile

Multi-stage build for optimized image:

1. **Build stage**: Node.js environment, npm install, vite build
2. **Production stage**: nginx alpine, serves static files

### docker-compose.yml

```yaml
services:
  qihb-quiz:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

### Commands

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔮 Future Enhancements

1. User accounts and progress sync
2. Spaced repetition algorithm
3. Audio pronunciation (native speakers)
4. Custom vocabulary import
5. Multi-language support
6. Leaderboards
7. Study mode (flashcards)
8. Export/share results
9. Dark mode
10. PWA support for offline use

---

## 📚 Maintenance Guide

### Adding New Question Types

1. Create component in `src/components/quiz/`
2. Add type to `types/index.ts`
3. Update `quizGenerator.ts` to generate the new type
4. Update `ExamPage.tsx` to render the new component
5. Add tests in `tests/`

### Modifying Database Schema

1. Update interfaces in `types/index.ts`
2. Update Dexie schema version in `lib/db.ts`
3. Add migration if needed
4. Update related stores and components

### Updating Vocabulary Data

1. Replace `public/files/hsk3.csv` with new data
2. Ensure CSV format matches expected columns
3. Clear browser IndexedDB or use "Xóa toàn bộ" on profile page
4. Refresh application to reload data
