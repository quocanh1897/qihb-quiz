# QIHB-Quiz 🎓

Quick Intelligent Human Bilingual

A modern vocabulary learning quiz application built with React, TypeScript, and TailwindCSS. Perfect for learning Chinese vocabulary (HSK3 level) with Vietnamese translations.

![QIHB-Quiz](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-teal) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

## ✨ Features

- **Import Vocabulary**: Load vocabulary from CSV files (HSK3 data included)
- **Quiz Generation**: Create quizzes with 4 length options (10/20/40/100 questions)
- **Multiple Choice Questions**: 6 options with various question types (word↔pinyin↔meaning)
- **Fill in the Blank Questions**: Complete example sentences by selecting the correct word
- **Matching Questions**: Drag & drop to match words, pinyin, and meanings
- **All Question Types Guaranteed**: Every quiz includes at least one of each question type
- **Frequency Tracking**: Track word appearances and accuracy
- **Global Learning Progress**: Track your overall learning progress across all quizzes
- **Interactive Word Details**: Click any word to see detailed information (pinyin, meaning, examples)
- **Analytics**: Detailed results with performance analysis
- **Time Tracking**: Monitor total time and per-question averages
- **Text-to-Speech**: Listen to word pronunciation using Web Speech API
- **Persistent Storage**: IndexedDB for data persistence

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd qihb-quiz

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

### Running Tests

The project uses [Playwright](https://playwright.dev/) for end-to-end testing.

```bash
# Run all tests (headless)
npm run test

# Run tests with interactive UI
npm run test:ui

# Run tests with browser visible
npm run test:headed

# Debug tests step by step
npm run test:debug
```

Tests automatically start the dev server before running. Test coverage includes:

- Home page loading and navigation
- Quiz setup and configuration
- Multiple choice question interaction
- Fill in the blank question interaction
- Matching question drag & drop
- All question types verification (every quiz has MC, fill-blank, and matching)
- Profile page and learning statistics

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and run the container
docker-compose up -d

# The app will be available at http://localhost:8080
```

### Manual Docker Build

```bash
# Build the Docker image
docker build -t qihb-quiz .

# Run the container
docker run -d -p 8080:80 qihb-quiz
```

### Docker Configuration

- **Production Build**: Uses nginx to serve the static files
- **Multi-stage Build**: Optimized image size (~25MB)
- **Port**: Exposed on port 80 (mapped to 8080 in docker-compose)

## 📁 Project Structure

```
qihb-quiz/
├── files/
│   └── hsk3.csv              # Default vocabulary data
├── public/
│   └── files/
│       └── hsk3.csv          # Vocabulary for production build
├── src/
│   ├── components/
│   │   ├── common/           # Shared UI components (Button, Card, Layout, etc.)
│   │   ├── quiz/             # Quiz-specific components (MultipleChoice, Matching, etc.)
│   │   └── results/          # Results page components (ScoreSummary, AnalyticsTable)
│   ├── config/               # Application configuration
│   ├── hooks/                # Custom React hooks (useTimer)
│   ├── lib/                  # Utilities (CSV parser, DB, quiz generator)
│   ├── pages/                # Page components
│   │   ├── HomePage.tsx      # Landing page with navigation
│   │   ├── QuizSetupPage.tsx # Quiz configuration
│   │   ├── ExamPage.tsx      # Quiz taking interface
│   │   ├── ResultsPage.tsx   # Quiz results and analytics
│   │   └── ProfilePage.tsx   # Learning statistics and history
│   ├── stores/               # Zustand state stores
│   └── types/                # TypeScript types
├── tests/                    # Playwright E2E tests
├── Dockerfile                # Docker build configuration
├── docker-compose.yml        # Docker Compose setup
├── SPECIFICATION.md          # Detailed feature specification
└── IMPLEMENTATION_PLAN.md    # Development plan
```

## 🎮 How to Use

1. **Start**: Launch the app and wait for vocabulary data to load
2. **Create Quiz**: Click "Tạo bài thi mới" and select quiz length
3. **Answer Questions**:
   - Multiple choice: Select one of 6 options (A-F)
   - Fill in the blank: Select the correct word to complete the sentence
   - Matching: Drag & drop to align words, pinyin, and meanings
4. **Navigate**: Use "Lùi" (Back) and "Tiến" (Next) buttons
5. **View Results**: See your score, time stats, and word analysis
6. **Track Progress**: Visit "Xem thống kê" to see your learning progress

## 📊 Question Types

### Trắc nghiệm (Multiple Choice)

- Word → Pinyin
- Pinyin → Word
- Meaning → Word
- Meaning → Pinyin
- Word → Meaning
- Pinyin → Meaning

### Điền ô trống (Fill in the Blank)

- Complete example sentences by choosing the correct word
- 6 options with similar-length words as distractors
- Shows sentence meaning after answering

### Nối từ (Matching)

- Match 3-6 sets of Word + Pinyin + Meaning

## 📈 Learning Statistics (Profile Page)

Access via "Xem thống kê" button:

- **Top 5 words to review**: Words with lowest progress scores
- **Global learning progress**: Track all words you've encountered
- **Quiz history**: View past quiz results with detailed breakdowns
- **Interactive word cards**: Click any word to see full details including:
  - Chinese characters
  - Pinyin pronunciation (with audio)
  - Word type
  - Vietnamese meanings
  - Example sentences with translations

## 🛠 Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Dexie.js** - IndexedDB wrapper
- **@dnd-kit** - Drag and drop
- **PapaParse** - CSV parsing
- **Vite** - Build tool
- **Playwright** - E2E testing
- **nginx** - Production server (Docker)

## 📝 CSV Data Format

The vocabulary CSV should have these columns (semicolon-separated):

```csv
Tiếng Trung;Phiên âm;Từ loại;Tiếng Việt;Ví dụ;Chú thích;Dịch
```

| Column      | Description                    |
| ----------- | ------------------------------ |
| Tiếng Trung | Chinese characters             |
| Phiên âm    | Pinyin pronunciation           |
| Từ loại     | Word type (noun, verb, etc.)   |
| Tiếng Việt  | Vietnamese meaning(s)          |
| Ví dụ       | Example sentence in Chinese    |
| Chú thích   | Example pinyin                 |
| Dịch        | Example Vietnamese translation |

## 🌐 Vietnamese UI Labels

| Label                       | Meaning                         |
| --------------------------- | ------------------------------- |
| Tạo bài thi mới             | Create new quiz                 |
| Xem thống kê                | View statistics                 |
| Ngắn / Trung / Dài / Tối đa | Short / Medium / Long / Maximum |
| Trắc nghiệm                 | Multiple choice                 |
| Điền ô trống                | Fill in the blank               |
| Nối từ                      | Matching                        |
| Gửi                         | Submit                          |
| Lùi / Tiến                  | Back / Next                     |
| Đúng / Sai                  | Correct / Wrong                 |
| Kết quả                     | Results                         |
| Phân tích                   | Analysis                        |
| Nghe                        | Listen (text-to-speech)         |

## 🛤 Routes

| Path       | Page                     |
| ---------- | ------------------------ |
| `/`        | Home page                |
| `/setup`   | Quiz setup/configuration |
| `/exam`    | Quiz examination         |
| `/results` | Quiz results             |
| `/profile` | Learning statistics      |

## 📄 License

MIT License - feel free to use and modify!

---

Built with ❤️ for Vietnamese learners of Chinese
