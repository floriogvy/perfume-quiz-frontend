import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');

  // Detect language from Shopify locale, URL, or browser
  useEffect(() => {
    const updateLanguage = () => {
      // Check URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      let shopifyLocale = urlParams.get('locale');

      // Fallback to Shopify's cookie or parent window
      if (!shopifyLocale && window.parent) {
        try {
          const parentUrl = new URL(window.parent.location.href);
          shopifyLocale = parentUrl.searchParams.get('locale') || getCookie('locale');
        } catch (e) {
          console.log('Could not access parent window:', e);
        }
      }

      // Fallback to browser language
      if (!shopifyLocale) {
        shopifyLocale = navigator.language.split('-')[0] || 'en';
      }

      setLanguage(shopifyLocale === 'zh' || shopifyLocale === 'zh-TW' ? 'zh' : 'en');
    };

    // Initial language check
    updateLanguage();

    // Listen for language changes via postMessage
    const handleMessage = (event) => {
      if (event.data && event.data.locale) {
        setLanguage(event.data.locale === 'zh' || event.data.locale === 'zh-TW' ? 'zh' : 'en');
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll parent URL every 1s for locale changes
    const interval = setInterval(updateLanguage, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  // Helper function to get cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Fetch questions from backend
  useEffect(() => {
    fetch('https://perfume-quiz-backend.onrender.com/questions')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setQuestions(data))
      .catch(error => console.error('Error fetching questions:', error));
  }, []);

  // Handle answer selection with debouncing
  const handleAnswer = (option) => {
    if (isLoading) return;
    setIsLoading(true);

    const newAnswers = [...answers, { questionId: questions[currentQuestion].id, option }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsLoading(false);
      }, 300); // Debounce to prevent rapid clicks
    } else {
      fetch('https://perfume-quiz-backend.onrender.com/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: newAnswers })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          setRecommendations(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching recommendations:', error);
          setIsLoading(false);
        });
    }
  };

  if (!questions.length) return <div>Loading...</div>;

  return (
    <div className="App">
      {recommendations ? (
        <div>
          <h2>{language === 'zh' ? '你的前三款香水推薦：' : 'Your Top 3 Perfume Preferences:'}</h2>
          <ul>
            {recommendations.map((perfume, index) => (
              <li key={index}>
                <a href={`https://floriographyscents.com/products/${perfume.name.toLowerCase().replace(/no.\s*\d+\s*/gi, '').replace(/\s+/g, '').replace(/'/g, '')}`}>
                  {language === 'zh' ? perfume.name_zh : perfume.name}
                </a>
                <p className="perfume-description">{language === 'zh' ? perfume.traits_zh.join(', ') : perfume.traits.join(', ')}</p>
              </li>
            ))}
          </ul>
          <button className="shop-now" onClick={() => window.location.href = 'https://floriographyscents.com/collections/all'}>
            {language === 'zh' ? '立即選購' : 'Shop Now'}
          </button>
        </div>
      ) : (
        <div>
          <h2>{questions[currentQuestion].text[language]}</h2>
          <div className="options">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.value)}
                disabled={isLoading}
                className={isLoading ? 'disabled' : ''}
              >
                {option[language]}
              </button>
            ))}
          </div>
          <p>{language === 'zh' ? `問題 ${currentQuestion + 1} 共 ${questions.length}` : `Question ${currentQuestion + 1} of ${questions.length}`}</p>
          {isLoading && <p>{language === 'zh' ? '正在載入結果...' : 'Loading results...'}</p>}
        </div>
      )}
    </div>
  );
}

export default App;