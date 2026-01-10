import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, Share2 } from 'lucide-react';
import { Layout, PageHeader } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { ScoreSummary } from '@/components/results/ScoreSummary';
import { TimeStats } from '@/components/results/TimeStats';
import { AnalyticsTable } from '@/components/results/AnalyticsTable';
import { useQuizStore } from '@/stores/quizStore';

export function ResultsPage() {
  const navigate = useNavigate();
  const { result, resetQuiz } = useQuizStore();

  useEffect(() => {
    if (!result) {
      navigate('/');
    }
  }, [result, navigate]);

  if (!result) {
    return null;
  }

  const handleNewQuiz = () => {
    resetQuiz();
    navigate('/setup');
  };

  const handleGoHome = () => {
    resetQuiz();
    navigate('/');
  };

  const handleShare = async () => {
    const percentage = Math.round((result.correctCount / result.totalQuestions) * 100);
    const shareText = `🎓 QIHB-Quiz: Tôi đạt ${percentage}% (${result.correctCount}/${result.totalQuestions} câu đúng) trong bài thi từ vựng HSK3!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kết quả QIHB-Quiz',
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Đã sao chép kết quả vào clipboard!');
      } catch (error) {
        alert(shareText);
      }
    }
  };

  return (
    <Layout>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoHome}
          icon={<Home size={18} />}
        >
          Trang chủ
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          icon={<Share2 size={18} />}
        >
          Chia sẻ
        </Button>
      </div>

      <PageHeader
        title="🎉 Hoàn thành!"
        subtitle="Xem kết quả và phân tích chi tiết bên dưới"
      />

      {/* Score Summary */}
      <div className="mb-6 animate-slide-up">
        <ScoreSummary result={result} />
      </div>

      {/* Time Stats */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <TimeStats result={result} />
      </div>

      {/* Analytics Table */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <AnalyticsTable frequencyData={result.frequencyData} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleGoHome}
          icon={<Home size={20} />}
        >
          Về trang chủ
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNewQuiz}
          icon={<RotateCcw size={20} />}
        >
          Làm bài mới
        </Button>
      </div>
    </Layout>
  );
}
