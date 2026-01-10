import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { QuizSetupPage } from '@/pages/QuizSetupPage';
import { ExamPage } from '@/pages/ExamPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { ProfilePage } from '@/pages/ProfilePage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/setup" element={<QuizSetupPage />} />
                <Route path="/exam" element={<ExamPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
