import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, Home, BookOpen } from 'lucide-react';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category?: string;
}

// Function to parse the flashcard output and convert it to structured data
function parseFlashcardOutput(rawOutput: string): Flashcard[] {
  const flashcards: Flashcard[] = [];
  
  // Split by numbered flashcards - look for pattern like "15. **"
  const flashcardBlocks = rawOutput.split(/(?=\d+\.\s\*\*)/g).filter(block => block.trim().match(/^\d+\.\s\*\*/));

  flashcardBlocks.forEach((block, index) => {
    try {
      // Extract front text (question between ** **)
      const frontMatch = block.match(/^\d+\.\s\*\*(.+?)\*\*/);
      if (!frontMatch) return;
      const front = frontMatch[1].trim();

      // Extract back text (answer after **Answer:** pattern)
      const backMatch = block.match(/\*\*Answer:\*\*\s*(.*?)(?=\d+\.\s\*\*|$)/s);
      if (!backMatch) {
        console.warn(`No answer found for flashcard ${index + 1}`);
        console.log('Block content:', block);
        return;
      }
      
      const back = backMatch[1].trim();
      
      // Skip if we couldn't extract both front and back
      if (!front || !back) {
        console.warn(`Skipping flashcard ${index + 1}: missing front or back`);
        console.log('Front:', front);
        console.log('Back:', back);
        return;
      }

      // Extract category if present (optional)
      const categoryMatch = block.match(/\*\*Category:\s*(.+?)\*\*/);
      const category = categoryMatch ? categoryMatch[1].trim() : undefined;

      flashcards.push({
        id: index + 1,
        front,
        back,
        category
      });
      
    } catch (error) {
      console.warn(`Failed to parse flashcard ${index + 1}:`, error);
      console.log('Block content:', block);
    }
  });
  
  console.log(`Successfully parsed ${flashcards.length} flashcards`);
  return flashcards;
}

export default function FlashcardQuiz() {
  const [flashcardData, setFlashcardData] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());
  const [studyCompleted, setStudyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Load flashcard data from localStorage
    const storedFlashcardData = localStorage.getItem('flashcardData');
    
    if (!storedFlashcardData) {
      setError('No flashcard data found. Please generate flashcards first.');
      setLoading(false);
      return;
    }

    console.log('Raw flashcard data:', storedFlashcardData);

    try {
      const parsedData = parseFlashcardOutput(storedFlashcardData);
      console.log('Parsed flashcard data:', parsedData);
      
      if (parsedData.length === 0) {
        setError('Could not parse flashcard data. Please try generating the flashcards again.');
      } else {
        setFlashcardData(parsedData);
        // Debug: Log the first flashcard to see its structure
        console.log('First flashcard:', parsedData[0]);
      }
    } catch (err) {
      setError('Error loading flashcard data. Please try again.');
      console.error('Flashcard parsing error:', err);
    }
    
    setLoading(false);
  }, []);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setReviewedCards(prev => new Set(prev).add(currentCard));
    }
  };

  const nextCard = () => {
    if (currentCard < flashcardData.length - 1) {
      setCurrentCard(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setStudyCompleted(true);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const resetStudy = () => {
    setCurrentCard(0);
    setIsFlipped(false);
    setReviewedCards(new Set());
    setStudyCompleted(false);
  };

  const goHome = () => {
    // Optionally clear flashcard data, or confirm navigation:
    // localStorage.removeItem('flashcardData');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Loading flashcards...</div>
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

  const currentFlashcard = flashcardData[currentCard];

  if (studyCompleted) {
    const reviewedCount = reviewedCards.size;
    const percentage = Math.round((reviewedCount / flashcardData.length) * 100);

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
        <div className="text-center">
          <div className="mb-8">
            <BookOpen className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Study Session Complete!</h1>
            <div className="text-6xl font-bold text-blue-600 mb-2">{reviewedCount}/{flashcardData.length}</div>
            <div className="text-xl text-gray-600">cards reviewed ({percentage}%)</div>
          </div>
          <button
            onClick={resetStudy}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto mb-4"
          >
            <RotateCcw className="w-5 h-5" />
            Study Again
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
            Card {currentCard + 1} of {flashcardData.length}
          </span>
        </div>
        <div style={{ width: 56, height: 1 }} /> {/* Spacer for alignment */}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
        <div className="w-48 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCard + 1) / flashcardData.length) * 100}%` }}
          />
        </div>
        <span>{reviewedCards.size} of {flashcardData.length} reviewed</span>
      </div>

      {/* Category Badge */}
      {currentFlashcard.category && (
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {currentFlashcard.category}
          </span>
        </div>
      )}

      {/* Flashcard */}
      <div className="relative mb-6">
        <div
          className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-8 min-h-[300px] flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-xl"
          onClick={handleFlip}
        >
          {/* Conditional rendering with fade transition */}
          <div className={`transition-all duration-300 ${isFlipped ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${isFlipped ? 'absolute' : ''}`}>
            {/* Front of card */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                Click to reveal answer
              </div>
              <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
                {currentFlashcard.front}
              </h2>
            </div>
          </div>

          <div className={`transition-all duration-300 ${!isFlipped ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${!isFlipped ? 'absolute' : ''}`}>
            {/* Back of card */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
                <EyeOff className="w-4 h-4" />
                Click to hide answer
              </div>
              <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap max-w-2xl">
                {currentFlashcard.back || 'No answer available'}
              </div>
            </div>
          </div>
        </div>

        {/* Flip instruction */}
        <div className="text-center mt-4">
          <button
            onClick={handleFlip}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            {isFlipped ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Answer
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Answer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevCard}
          disabled={currentCard === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            currentCard === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {reviewedCards.has(currentCard) ? (
              <span className="text-green-600 font-medium">✓ Reviewed</span>
            ) : (
              <span>Not reviewed</span>
            )}
          </div>
        </div>

        <button
          onClick={nextCard}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200"
        >
          {currentCard === flashcardData.length - 1 ? 'Finish Study' : 'Next'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Study Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Study Tips:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Try to answer before flipping the card</li>
          <li>• Review cards multiple times for better retention</li>
          <li>• Focus extra attention on cards you find difficult</li>
        </ul>
      </div>
    </div>
  );
}