import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(null); // Initialize as null

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
    let cachedLocale = null;

    const updateLanguage = () => {
      if (cachedLocale && cachedLocale === (language === 'zh' || language === 'zh-TW' ? 'zh' : 'en')) {
        console.log('iPhone debug: Using cached locale:', cachedLocale);
        return;
      }

      // Check URL parameter first
      const urlParams = new URLSearchParams(window.location.search);
      let shopifyLocale = urlParams.get('locale');
      console.log('iPhone debug: URL locale:', shopifyLocale);

      // Fallback to cookies
      if (!shopifyLocale) {
        const cookies = ['locale', 'cart_currency', 'shopify_locale', '_shopify_y', '_shopify_s'];
        for (const cookie of cookies) {
          shopifyLocale = getCookie(cookie);
          console.log(`iPhone debug: Cookie ${cookie}:`, shopifyLocale);
          if (shopifyLocale && (shopifyLocale === 'zh' || shopifyLocale === 'zh-TW' || shopifyLocale === 'en')) break;
        }
      }

      // Fallback to parent window URL
      if (!shopifyLocale && window.parent) {
        try {
          const parentUrl = new URL(window.parent.location.href);
          shopifyLocale = parentUrl.searchParams.get('locale');
          console.log('iPhone debug: Parent URL locale:', shopifyLocale);
        } catch (e) {
          console.log('iPhone debug: Could not access parent window:', e);
        }
      }

      // Avoid browser language fallback unless no other source
      if (!shopifyLocale) {
        shopifyLocale = 'en';
        console.log('iPhone debug: Defaulting to en (no locale found)');
      }

      cachedLocale = shopifyLocale;
      const newLanguage = shopifyLocale === 'zh' || shopifyLocale === 'zh-TW' ? 'zh' : 'en';
      console.log('iPhone debug: Setting language:', newLanguage);
      if (newLanguage !== language) {
        setLanguage(newLanguage);
      }
    };

    updateLanguage();

    // Listen for language changes via postMessage
    const handleMessage = (event) => {
      if (event.data && event.data.locale) {
        console.log('iPhone debug: Received postMessage locale:', event.data.locale);
        cachedLocale = event.data.locale;
        const newLanguage = event.data.locale === 'zh' || event.data.locale === 'zh-TW' ? 'zh' : 'en';
        if (newLanguage !== language) {
          setLanguage(newLanguage);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [language]); // Added language as dependency

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
            console.log('iPhone debug: Rendering recommendations with language:', language);
            alert(`Debug: Language when rendering results is ${language}`);
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
            {recommendations.map((perfume, index) => {
              const linkUrl = `https://floriographyscents.com${language === 'zh' ? '/zh' : ''}/products/${productHandles[perfume.name]}`;
              return (
                <li key={index} className="perfume-button">
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      console.log('iPhone debug: Clicking link:', linkUrl);
                      alert(`Debug: Clicking link for ${perfume.name_zh || perfume.name}: ${linkUrl}`);
                    }}
                  >
                    {language === 'zh' ? perfume.name_zh : perfume.name}
                  </a>
                  <p className="perfume-description">{language === 'zh' ? perfume.traits_zh.join(', ') : perfume.traits.join(', ')}</p>
                </li>
              );
            })}
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