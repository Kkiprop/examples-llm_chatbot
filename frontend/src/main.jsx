import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { backend } from 'declarations/backend';
import botImg from '/bot.svg';
import userImg from '/user.svg';
import '/index.css';

const App = () => {
  const [chat, setChat] = useState([
    { role: 'system', content: "I'm a crypto trading assistant. Ask me anything!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef(null);

  const formatDate = (date) => {
    const h = '0' + date.getHours();
    const m = '0' + date.getMinutes();
    return `${h.slice(-2)}:${m.slice(-2)}`;
  };

  // Fetch Market Data
  const getMarketData = async (coin) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`
      );
      const data = await response.json();
      return data[coin]?.usd ? `Current ${coin.toUpperCase()} price: $${data[coin].usd}` : "Market data not available.";
    } catch (error) {
      console.error("Error fetching market data:", error);
      return "Unable to retrieve market data.";
    }
  };

  // Process Chat Message with Backend
  const askAgent = async (messages) => {
    try {
      const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
      let marketInsight = "";

      if (lastUserMessage.includes("bitcoin") || lastUserMessage.includes("btc")) {
        marketInsight = await getMarketData("bitcoin");
      } else if (lastUserMessage.includes("ethereum") || lastUserMessage.includes("eth")) {
        marketInsight = await getMarketData("ethereum");
      }

      // Append market data insight to the message
      const userMessage = {
        role: "user",
        content: lastUserMessage + " " + marketInsight
      };

      // Convert messages to the format expected by `backend.chat`
      const formattedMessages = messages.map(msg => ({
        role: msg.role === "user" ? { user: null } : { system: null },
        content: msg.content
      }));

      // Send message to backend
      const response = await backend.chat([...formattedMessages, userMessage]);

      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        newChat.push({ role: 'system', content: response });
        return newChat;
      });
    } catch (e) {
      console.error(e);
      alert("Error processing your request. Please try again.");
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        return newChat;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Input
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    const thinkingMessage = { role: 'system', content: 'Thinking ...' };

    setChat((prevChat) => [...prevChat, userMessage, thinkingMessage]);
    setInputValue('');
    setIsLoading(true);

    // Only send the last 10 messages to keep context short
    const messagesToSend = chat.slice(-10).concat(userMessage);
    askAgent(messagesToSend);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg">
        <div className="flex-1 overflow-y-auto rounded-t-lg bg-gray-100 p-4" ref={chatBoxRef}>
          {chat.map((message, index) => {
            const isUser = message.role === 'user';
            const img = isUser ? userImg : botImg;
            const name = isUser ? 'User' : 'Assistant';
            const text = message.content;

            return (
              <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                {!isUser && (
                  <div
                    className="mr-2 h-10 w-10 rounded-full"
                    style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                  ></div>
                )}
                <div className={`max-w-[70%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-white shadow'}`}>
                  <div
                    className={`mb-1 flex items-center justify-between text-sm ${isUser ? 'text-white' : 'text-gray-500'}`}
                  >
                    <div>{name}</div>
                    <div className="mx-2">{formatDate(new Date())}</div>
                  </div>
                  <div>{text}</div>
                </div>
                {isUser && (
                  <div
                    className="ml-2 h-10 w-10 rounded-full"
                    style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
        <form className="flex rounded-b-lg border-t bg-white p-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="flex-1 rounded-l border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about Bitcoin, Ethereum..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="rounded-r bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
