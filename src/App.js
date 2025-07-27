import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  // Fetch questions from backend
  useEffect(() => {
    fetch('http://localhost:3000/questions')
      .then(response => response.json())
      .then(data => setQuestions(data))
      .catch(error => console.error('Error fetching questions:', error));
  }, []);

  // Handle answer selection
  const handleAnswer = (option) => {
    if (isLoading) return; // Prevent multiple clicks
    setIsLoading(true); // Set loading state

    const newAnswers = [...answers, { questionId: questions[currentQuestion].id, option }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsLoading(false); // Reset loading for next question
    } else {
      // Submit answers when quiz is complete
      fetch('http://localhost:3000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: newAnswers })
      })
        .then(response => response.json())
        .then(data => {
          setRecommendations(data);
          setIsLoading(false); // Reset loading after fetch
        })
        .catch(error => {
          console.error('Error fetching recommendations:', error);
          setIsLoading(false); // Reset loading on error
        });
    }
  };

  if (!questions.length) return <div>Loading...</div>;

  return (
    <div className="App">
      {recommendations ? (
        <div>
          <h2>Your Top 3 Perfume Preferences:</h2>
          <ul>
            {recommendations.map((perfume, index) => (
              <li key={index}>
                <a href={`https://floriographyscents.com/products/${perfume.name.toLowerCase().replace(/no.\s*\d+\s*/gi, '').replace(/\s+/g, '').replace(/'/g, '')}`}>
                  {perfume.name}
                </a>
                <p className="perfume-description">{perfume.traits.join(', ')}</p>
              </li>
            ))}
          </ul>
          <button className="shop-now" onClick={() => window.location.href = 'https://floriographyscents.com/collections/all'}>
            Shop Now
          </button>
        </div>
      ) : (
        <div>
          <h2>{questions[currentQuestion].text.en}</h2>
          <div className="options">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.value)}
                disabled={isLoading} // Disable buttons during loading
                className={isLoading ? 'disabled' : ''}
              >
                {option.en}
              </button>
            ))}
          </div>
          <p>Question {currentQuestion + 1} of {questions.length}</p>
          {isLoading && <p>Loading results...</p>} {/* Visual feedback */}
        </div>
      )}
    </div>
  );
}

export default App;