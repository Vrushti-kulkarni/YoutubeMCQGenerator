"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

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

// Raw MCQ output - modify this variable to change the quiz content
const mcq_output = `**Machine Learning Algorithms Quiz**

**Instructions:** Choose the best answer for each multiple-choice question.

1. **Which of the following best describes linear regression?**
    (A) A classification algorithm predicting categorical outcomes.
    (B) A clustering algorithm grouping similar data points.
    (C) A regression algorithm predicting a continuous output based on input variables.
    (D) A dimensionality reduction technique.
    **Correct Answer: (C)**  Linear regression models the relationship between variables using a linear equation to predict a continuous outcome.

2. **In the equation  \`y = θ0 + θ1x\` for linear regression, what does  \`θ1\` represent?**
    (A) The y-intercept.
    (B) The sum of squared errors.
    (C) The slope of the line.
    (D) The learning rate.
    **Correct Answer: (C)**  \`θ1\` represents the slope, indicating the change in y for a unit change in x.

3. **What is the primary purpose of gradient descent in linear regression?**
    (A) To calculate the R-squared value.
    (B) To find the optimal values of the model's parameters (e.g., θ0 and θ1).
    (C) To categorize data points into clusters.
    (D) To reduce the dimensionality of the data.
    **Correct Answer: (B)** Gradient descent iteratively updates parameters to minimize the cost function, finding the best-fit line.

4. **Which metric is a better indicator of model fit when considering the number of predictor variables?**
    (A) R-squared
    (B) Mean Squared Error (MSE)
    (C) Adjusted R-squared
    (D) Learning Rate
    **Correct Answer: (C)** Adjusted R-squared penalizes the addition of irrelevant predictors, providing a more reliable measure than R-squared alone.

5. **Ridge and Lasso regression are primarily used to address which issue in linear regression?**
    (A) High bias
    (B) Overfitting
    (C) Underfitting
    (D) High variance in independent variables
    **Correct Answer: (B)**  These regularization techniques prevent overfitting by shrinking coefficients of less important features.

6. **Which of the following is an example of an unsupervised learning algorithm?**
    (A) Logistic Regression
    (B) Linear Regression
    (C) K-means Clustering
    (D) Decision Tree
    **Correct Answer: (C)** K-means clustering is an unsupervised technique that groups data without labeled outputs.

7. **Which algorithm is best suited for predicting the probability of a binary outcome (e.g., yes/no)?**
    (A) Linear Regression
    (B) K-Nearest Neighbors (k-NN)
    (C) Logistic Regression
    (D) K-means Clustering
    **Correct Answer: (C)** Logistic regression models the probability of a categorical outcome using a sigmoid function.

8. **Principal Component Analysis (PCA) is primarily used for:**
    (A) Clustering data points.
    (B) Predicting continuous outcomes.
    (C) Dimensionality reduction.
    (D) Building decision trees.
    **Correct Answer: (C)** PCA transforms data into a lower-dimensional space while preserving variance.

9.  **What is the key difference between supervised and unsupervised learning?**
    (A) Supervised learning uses labeled data, while unsupervised learning uses unlabeled data.
    (B) Supervised learning is for classification, unsupervised learning is for regression.
    (C) Supervised learning is faster, unsupervised learning is more accurate.
    (D) Supervised learning uses algorithms like K-means, unsupervised learning uses linear regression.
    **Correct Answer: (A)**  This accurately defines the core distinction between these learning paradigms.

10. **Which of the following is NOT an ensemble method?**
    (A) Random Forest
    (B) Boosting
    (C) Gradient Boosting
    (D) Linear Regression
    **Correct Answer: (D)** Linear Regression is a single model, not an ensemble of multiple models.  Ensemble methods combine multiple models to improve predictive accuracy.`;

// Function to parse the MCQ output and convert it to structured data
function parseMCQOutput(rawOutput: string): MCQQuestion[] {
  const questions: MCQQuestion[] = [];
  
  // Split by numbered questions
  const questionBlocks = rawOutput.split(/(?=\d+\.\s)/g).filter(block => block.trim() && /^\d+\./.test(block.trim()));
  
  questionBlocks.forEach((block, index) => {
    try {
      // Extract question text (between ** **)
      const questionMatch = block.match(/^\d+\.\s\*\*(.+?)\*\*/);
      if (!questionMatch) return;
      
      const question = questionMatch[1].trim();
      
      // Extract all options
      const optionLines = block.split('\n').filter(line => line.trim().match(/^\([ABCD]\)/));
      
      if (optionLines.length !== 4) {
        console.warn(`Question ${index + 1} doesn't have exactly 4 options`);
        return;
      }
      
      const options: {A: string, B: string, C: string, D: string} = {A: '', B: '', C: '', D: ''};
      
      optionLines.forEach(line => {
        const match = line.trim().match(/^\(([ABCD])\)\s(.+)$/);
        if (match) {
          const [, letter, text] = match;
          options[letter as 'A'|'B'|'C'|'D'] = text.trim();
        }
      });
      
      // Extract correct answer
      const correctAnswerMatch = block.match(/\*\*Correct Answer:\s*\(([ABCD])\)\*\*/);
      if (!correctAnswerMatch) {
        console.warn(`Question ${index + 1} doesn't have a correct answer marked`);
        return;
      }
      
      const correctAnswer = correctAnswerMatch[1] as 'A'|'B'|'C'|'D';
      
      // Extract explanation (text after correct answer, multi-line safe)
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

// Parse the MCQ data from the raw output
const mcqData: MCQQuestion[] = parseMCQOutput(mcq_output);

export default function MCQQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [showExplanation, setShowExplanation] = useState<{[key: number]: boolean}>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

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

  const calculateScore = () => {
    let correct = 0;
    mcqData.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  // Add safety check for empty mcqData
  if (!mcqData || mcqData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Quiz Error</h1>
          <p className="text-gray-600">No questions could be parsed from the MCQ output. Please check the format.</p>
        </div>
      </div>
    );
  }

  const currentMCQ = mcqData[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const showCurrentExplanation = showExplanation[currentQuestion];

  // Add safety check for currentMCQ
  if (!currentMCQ) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Question Not Found</h1>
          <p className="text-gray-600">Current question could not be loaded.</p>
        </div>
      </div>
    );
  }

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
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-green-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{score}</div>
                <div className="text-sm text-green-800">Correct</div>
              </div>
              <div className="bg-red-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{mcqData.length - score}</div>
                <div className="text-sm text-red-800">Incorrect</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{mcqData.length}</div>
                <div className="text-sm text-blue-800">Total</div>
              </div>
            </div>
          </div>

          <button
            onClick={resetQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Machine Learning Algorithms Quiz
        </h1>
        <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
          <span>Question {currentQuestion + 1} of {mcqData.length}</span>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / mcqData.length) * 100}%` }}
            ></div>
          </div>
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