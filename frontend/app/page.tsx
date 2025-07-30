"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Youtube, Brain, ArrowRight, Loader2, AlertCircle, BookOpen, HelpCircle } from 'lucide-react';

type QuizType = 'mcq' | 'flashcard';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [quizType, setQuizType] = useState<QuizType>('mcq');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = quizType === 'mcq' ? '/process-video' : '/process-video-flashcards';
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to process video for ${quizType}`);
      }

      const data = await response.json();
      
      if (quizType === 'mcq') {
        // Store the MCQ data in localStorage for the quiz page
        localStorage.setItem('mcqData', data.mcq_data);
        localStorage.setItem('videoId', data.video_id);
        router.push('/quiz');
      } else {
        // Store the flashcard data in localStorage for the flashcard page
        localStorage.setItem('flashcardData', data.flashcard_data);
        localStorage.setItem('videoId', data.video_id);
        router.push('/flashcard');
      }

    } catch (err) {
      console.error('Error processing video:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <Youtube className="w-8 h-8 text-white" />
            </div>
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            YouTube to
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Learning Quiz</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform any YouTube video into interactive learning materials. 
            Choose between MCQ quizzes or flashcards for your preferred study method.
          </p>
        </div>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="space-y-6">
              {/* Quiz Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Choose Learning Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setQuizType('mcq')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      quizType === 'mcq'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    disabled={isProcessing}
                  >
                    <HelpCircle className="w-6 h-6" />
                    <span className="font-medium">MCQ Quiz</span>
                    <span className="text-xs text-center">Multiple choice questions with explanations</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setQuizType('flashcard')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      quizType === 'flashcard'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                    disabled={isProcessing}
                  >
                    <BookOpen className="w-6 h-6" />
                    <span className="font-medium">Flashcards</span>
                    <span className="text-xs text-center">Interactive flip cards for active recall</span>
                  </button>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  YouTube Video URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-lg text-black pr-12"
                    disabled={isProcessing}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                  <Youtube className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                  quizType === 'mcq'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating {quizType === 'mcq' ? 'Quiz' : 'Flashcards'}...
                  </>
                ) : (
                  <>
                    Generate {quizType === 'mcq' ? 'MCQ Quiz' : 'Flashcards'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Video Analysis</h3>
              <p className="text-gray-600 text-sm">AI analyzes video transcripts to extract key concepts and learning points</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Smart Content</h3>
              <p className="text-gray-600 text-sm">Generates thoughtful questions and flashcards that test understanding</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Interactive Learning</h3>
              <p className="text-gray-600 text-sm">Engage with content through multiple choice questions or flip-card study</p>
            </div>
          </div>

          {/* Learning Method Comparison */}
          <div className="mt-12 bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Which method should you choose?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  MCQ Quiz
                </h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Great for testing comprehension</li>
                  <li>• Immediate feedback with explanations</li>
                  <li>• Perfect for exam preparation</li>
                  <li>• Tracks your performance</li>
                </ul>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Flashcards
                </h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Ideal for memorization and recall</li>
                  <li>• Active learning through repetition</li>
                  <li>• Self-paced study sessions</li>
                  <li>• Perfect for vocabulary and concepts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Video</h3>
              <p className="text-gray-600">
                Our AI is analyzing the video content and generating {quizType === 'mcq' ? 'quiz questions' : 'flashcards'}. This may take a few minutes...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}