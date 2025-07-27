import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');

  // Map perfume names to Shopify product handles
  const productHandles = {
    "No. 01 Old Bookstore": "oldbookstore",
    "No. 29 Sara's Softener": "sarassoftener",
    "No. 34 After Rain Earth": "afterrainearth",
    "No. 37 Bamboo Mist": "bamboomist",
    "No. 39 Osmanthus Tea": "osmanthustea",
    "No. 40 Bar Rocking Chair": "barrockingchair",
    "No. 41 White Birch": "whitebirch",
    "No. 42 Löyly": "loyly",
    "No. 43 Nukkua": "nukkua",
    "No. 54 Mimosa Marzipan": "mimosamarzipan",
    "No. 60 852 Concrete": "852concrete",
    "No. 61 852 Orchid": "852orchid",
    "No. 73 Shine Muscat": "shinemuscat",
    "No. 75 Dry Yuzu": "dryyuzu",
    "No. 82 Ethereal Lilies": "ethereallilies",
    "No. 92 Cornfields": "cornfields",
    "No. 100 Pop the Apple Fizz": "poptheapplefizz",
    "No. 64 Ume": "ume",
    "No. 97 The Guava Tree": "theguavatree"
  };

  // Detect language
  useEffect(() => {
    const updateLanguage = () => {
      // Check URL parameter first
      const urlParams = new URLSearchParams(window.location.search);
      let shopifyLocale = urlParams.get('locale');

      // Fallback to cookies
      if (!shopifyLocale) {
        shopifyLocale = getCookie('locale') || getCookie('cart_currency') || getCookie('shopify_locale');
      }

      // Fallback to browser language
      if (!shopifyLocale) {
        shopifyLocale = navigator.language.split('-')[0] || 'en';
      }

      setLanguage(shopifyLocale === 'zh' || shopifyLocale === 'zh-TW' ? 'zh' : 'en');
    };

    updateLanguage();

    // Listen for language changes via postMessage
    const handleMessage = (event) => {
      if (event.data && event.data.locale) {
        setLanguage(event.data.locale === 'zh' || event.data.locale === 'zh-TW' ? 'zh' : 'en');
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll cookies for mobile (less aggressive)
    const interval = setInterval(updateLanguage, 2000);

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

  // Fetch questions
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

  // Handle answer selection
  let debounceTimeout = null;
  const handleAnswer = (option) => {
    if (isLoading) return;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      setIsLoading(true);
      const newAnswers = [...answers, { questionId: questions[currentQuestion].id, option }];
      setAnswers(newAnswers);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setIsLoading(false);
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
    }, 500);
  };

  if (!questions.length) return <div>Loading...</div>;

  return (
    <div className="App">
      {recommendations ? (
        <div>
          <h2>{language === 'zh' ? '你的前三款香水推薦：' : 'Your Top 3 Perfume Recommendations:'}</h2>
          <ul>
            {recommendations.map((perfume, index) => (
              <li key={index} className="perfume-button">
                <a
                  href={`https://floriographyscents.com${language === 'zh' ? '/zh' : ''}/products/${productHandles[perfume.name]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {language === 'zh' ? perfume.name_zh : perfume.name}
                </a>
                <p className="perfume-description">{language === 'zh' ? perfume.traits_zh.join(', ') : perfume.traits.join(', ')}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <h2>{questions[currentQuestion].text[language]}</h2>
          <div className="options">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  handleAnswer(option.value);
                }}
                onWheel={(e) => e.preventDefault()}
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