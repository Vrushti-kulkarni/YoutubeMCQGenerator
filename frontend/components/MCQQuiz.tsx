import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle, Home } from 'lucide-react';

interface MCQQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

// Function to parse the MCQ output and convert it to structured data
function parseMCQOutput(rawOutput: string): MCQQuestion[] {
  const questions: MCQQuestion[] = [];
  
  // Split by numbered questions (robust for markdown from backend)
  const questionBlocks = rawOutput.split(/\n(?=\d+\.\s\*\*)/g).filter(block => block.trim().match(/^\d+\.\s\*\*/));

  questionBlocks.forEach((block, index) => {
    try {
      // Extract question text (between ** **)
      const questionMatch = block.match(/^\d+\.\s\*\*(.+?)\*\*/);
      if (!questionMatch) return;
      const question = questionMatch[1].trim();

      // Extract all options (A-D)
      const options: {A: string, B: string, C: string, D: string} = {A: '', B: '', C: '', D: ''};
      const optionRegex = /^\s*\(([ABCD])\)\s(.+)$/gm;
      let match;
      let foundOptions = 0;
      while ((match = optionRegex.exec(block)) !== null) {
        const letter = match[1] as 'A'|'B'|'C'|'D';
        const text = match[2].trim();
        options[letter] = text;
        foundOptions++;
      }
      if (foundOptions !== 4) {
        console.warn(`Question ${index + 1} doesn't have exactly 4 options`);
        return;
      }

      // Extract correct answer
      const correctAnswerMatch = block.match(/\*\*Correct Answer:\s*\(([ABCD])\)\*\*/);
      if (!correctAnswerMatch) {
        console.warn(`Question ${index + 1} doesn't have a correct answer marked`);
        return;
      }
      const correctAnswer = correctAnswerMatch[1] as 'A'|'B'|'C'|'D';

      // Extract explanation (text after correct answer)
      const explanationMatch = block.match(/\*\*Correct Answer:\s*\([ABCD]\)\*\*\s*([\s\S]*)$/);
      const explanation = explanationMatch ? explanationMatch[1].trim() : '';

      questions.push({
        id: index + 1,
        question,
        options,
        correctAnswer,
        explanation
      });
    } catch (error) {
      console.warn(`Failed to parse question ${index + 1}:`, error);
    }
  });
  return questions;
}

export default function MCQQuiz() {
  const [mcqData, setMcqData] = useState<MCQQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [showExplanation, setShowExplanation] = useState<{[key: number]: boolean}>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Load MCQ data from localStorage
    const storedMcqData = localStorage.getItem('mcqData');
    
    if (!storedMcqData) {
      setError('No quiz data found. Please generate a quiz first.');
      setLoading(false);
      return;
    }

    try {
      const parsedData = parseMCQOutput(storedMcqData);
      if (parsedData.length === 0) {
        setError('Could not parse quiz questions. Please try generating the quiz again.');
      } else {
        setMcqData(parsedData);
      }
    } catch (err) {
      setError('Error loading quiz data. Please try again.');
      console.error('MCQ parsing error:', err);
    }
    
    setLoading(false);
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));
    setShowExplanation(prev => ({
      ...prev,
      [currentQuestion]: true
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < mcqData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setQuizCompleted(false);
  };

  const goHome = () => {
  // Optionally clear quiz data, or confirm navigation:
  // localStorage.removeItem('mcqData');
  router.push('/');
};

const calculateScore = () => {
  let correct = 0;
  mcqData.forEach((question, idx) => {
    if (selectedAnswers[idx] === question.correctAnswer) {
      correct++;
    }
  });
  return correct;
};

if (loading) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg text-gray-500">Loading quiz...</div>
    </div>
  );
}

if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-red-100 text-red-700 rounded px-6 py-4">
        {error}
      </div>
      <button
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={goHome}
      >
        <Home className="w-5 h-5" />
        Go Home
      </button>
    </div>
  );
}

const currentMCQ = mcqData[currentQuestion];
const selectedAnswer = selectedAnswers[currentQuestion];
const showCurrentExplanation = showExplanation[currentQuestion];

if (quizCompleted) {
  const score = calculateScore();
  const percentage = Math.round((score / mcqData.length) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="text-center">
        <div className="mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
          <div className="text-6xl font-bold text-blue-600 mb-2">{score}/{mcqData.length}</div>
          <div className="text-xl text-gray-600">({percentage}%)</div>
        </div>
        <button
          onClick={resetQuiz}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto mb-4"
        >
          <RotateCcw className="w-5 h-5" />
          Retake Quiz
        </button>
        <button
          onClick={goHome}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <Home className="w-5 h-5" />
          Home
        </button>
      </div>
    </div>
  );
}

return (
  <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
    {/* Header */}
    <div className="mb-8 flex items-center justify-between">
      <button
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
        onClick={goHome}
      >
        <Home className="w-5 h-5" />
        Home
      </button>
      <div>
        <span className="text-base text-gray-700">
          Question {currentQuestion + 1} of {mcqData.length}
        </span>
      </div>
      <div style={{ width: 56, height: 1 }} /> {/* Spacer for alignment */}
    </div>

    {/* Progress Bar */}
    <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
      <div className="w-48 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / mcqData.length) * 100}%` }}
        />
      </div>
    </div>

    {/* Question Card */}
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
        {currentMCQ.question}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {Object.entries(currentMCQ.options).map(([letter, option]) => {
          const isSelected = selectedAnswer === letter;
          const isCorrect = letter === currentMCQ.correctAnswer;
          const showResult = showCurrentExplanation;

          let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ";

          if (showResult) {
            if (isCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-800";
            } else if (isSelected && !isCorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-800";
            } else {
              buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
            }
          } else if (isSelected) {
            buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
          } else {
            buttonClass += "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50";
          }

          return (
            <button
              key={letter}
              onClick={() => !showCurrentExplanation && handleAnswerSelect(letter)}
              className={buttonClass}
              disabled={showCurrentExplanation}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">({letter})</span>
                <span>{option}</span>
                {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 ml-auto" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showCurrentExplanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Explanation:</h3>
          <p className="text-blue-700">{currentMCQ.explanation}</p>
        </div>
      )}
    </div>

    {/* Navigation */}
    <div className="flex justify-between items-center">
      <button
        onClick={prevQuestion}
        disabled={currentQuestion === 0}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
          currentQuestion === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </button>
      <div className="text-sm text-gray-500">
        {Object.keys(selectedAnswers).length} of {mcqData.length} answered
      </div>
      <button
        onClick={nextQuestion}
        disabled={!selectedAnswer}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
          !selectedAnswer
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {currentQuestion === mcqData.length - 1 ? 'Finish Quiz' : 'Next'}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </div>
);
}
