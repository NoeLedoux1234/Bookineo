'use client';

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  subject: string;
  isRead: boolean;
  sentAt: string;
}

interface MessageDetail {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  receiver: {
    id: string;
    name: string;
  };
  content: string;
  isRead: boolean;
  sentAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);

  // États pour la composition d'un message
  const [recipient, setRecipient] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du compteur:', error);
    }
  };

  const handleMessageClick = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMessage(data.message);

        // Mettre à jour la liste et le compteur si le message n'était pas lu
        if (!data.message.isRead) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId ? { ...msg, isRead: true } : msg
            )
          );
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du message:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !messageContent.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverEmail: recipient,
          content: messageContent,
        }),
      });

      if (response.ok) {
        setShowCompose(false);
        setRecipient('');
        setMessageContent('');
        fetchMessages(); // Rafraîchir la liste
      } else {
        alert("Erreur lors de l'envoi du message");
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600);

    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement de vos messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Messagerie</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0
                ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
                : 'Aucun nouveau message'}
            </p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nouveau message
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Liste des messages */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-medium text-gray-900">Messages reçus</h2>
              </div>
              <div className="divide-y">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📬</div>
                    <p>Aucun message</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?.id === message.id
                          ? 'bg-blue-50 border-r-2 border-blue-600'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${message.isRead ? 'bg-gray-300' : 'bg-blue-600'}`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm ${message.isRead ? 'text-gray-600' : 'text-gray-900'}`}
                          >
                            {message.sender.name}
                          </p>
                          <p
                            className={`text-sm truncate ${message.isRead ? 'text-gray-500' : 'text-gray-700'}`}
                          >
                            {message.subject}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(message.sentAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Contenu du message */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border h-full">
              {selectedMessage ? (
                <div className="h-full flex flex-col">
                  {/* Header du message */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedMessage.sender.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedMessage.sentAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            selectedMessage.isRead
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {selectedMessage.isRead ? 'Lu' : 'Non lu'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu du message */}
                  <div className="flex-1 p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 border-t bg-gray-50">
                    <button
                      onClick={() => {
                        setRecipient(selectedMessage.sender.name);
                        setShowCompose(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Répondre
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💌</div>
                    <p className="text-lg">
                      Sélectionnez un message pour le lire
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de composition */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Nouveau message
                </h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinataire (email)
                    </label>
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="exemple@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Votre message..."
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
