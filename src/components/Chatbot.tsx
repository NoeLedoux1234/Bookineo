'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  context?: string;
  fallback?: boolean;
  intelligent?: boolean;
  enhanced?: boolean;
  bookData?: {
    books?: any[];
    rentals?: any[];
    total?: number;
  };
  actions?: ChatbotAction[];
}

interface ChatbotAction {
  type:
    | 'search_books'
    | 'view_book'
    | 'rent_book'
    | 'view_rentals'
    | 'external_link';
  label: string;
  payload?: {
    bookId?: string;
    url?: string;
    filters?: Record<string, string>;
  };
}

interface ChatbotProps {
  context?: 'books' | 'rentals' | 'account' | 'general';
}

export default function Chatbot({ context = 'general' }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Bonjour ! Je suis votre assistant Bookineo. Comment puis-je vous aider aujourd'hui ?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          context,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.message,
          isBot: true,
          timestamp: new Date(),
          context: data.data.context,
          fallback: data.data.fallback,
          intelligent: data.data.intelligent,
          enhanced: data.data.enhanced,
          bookData: data.data.bookData,
          actions: data.data.actions,
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.message || "Erreur lors de l'envoi du message");
      }
    } catch (error) {
      console.error('Erreur chatbot:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          'Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.',
        isBot: true,
        timestamp: new Date(),
        fallback: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAction = (action: ChatbotAction) => {
    switch (action.type) {
      case 'external_link':
        if (action.payload?.url) {
          window.location.href = action.payload.url;
        }
        break;
      case 'view_book':
        if (action.payload?.bookId) {
          window.open(`/books/${action.payload.bookId}`, '_blank');
        }
        break;
      case 'search_books':
        // Rediriger vers la page de recherche avec filtres
        const params = new URLSearchParams();
        if (action.payload?.filters) {
          Object.entries(action.payload.filters).forEach(([key, value]) => {
            if (value) params.append(key, value as string);
          });
        }
        window.location.href = `/?${params.toString()}`;
        break;
      case 'view_rentals':
        window.location.href = '/rentals';
        break;
      default:
        console.log('Action non supportée:', action);
    }
  };

  const contextLabels = {
    books: 'Livres',
    rentals: 'Locations',
    account: 'Compte',
    general: 'Assistance',
  };

  return (
    <>
      {/* Bouton d'ouverture du chatbot */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
          aria-label="Ouvrir le chatbot"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Interface du chatbot */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Assistant Bookineo</h3>
              <p className="text-xs opacity-90">{contextLabels[context]}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Fermer le chatbot"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? `bg-gray-100 text-gray-800 ${
                          message.fallback
                            ? 'border-l-4 border-orange-400'
                            : message.intelligent
                              ? 'border-l-4 border-green-400'
                              : message.enhanced
                                ? 'border-l-4 border-blue-400'
                                : ''
                        }`
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">
                    {message.content}
                  </p>

                  {/* Actions boutons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleAction(action)}
                          className="block w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Badges d'état */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex space-x-1">
                      {message.intelligent && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          🧠 Intelligent
                        </span>
                      )}
                      {message.enhanced && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          ⚡ Enhanced AI
                        </span>
                      )}
                      {message.fallback && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          🔄 Fallback
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                maxLength={500}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {inputMessage.length}/500 caractères
            </p>
          </div>
        </div>
      )}
    </>
  );
}
