import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Message } from '../../api/room';
import { getMessages } from '../../api/room';
import { createStompClient } from '../../api/websocket';
import { isLoggedInAtom, userIdAtom } from '../../common/user';
import './ChatRoom.css';
import type { Client } from '@stomp/stompjs';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [_loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState(Date.now());
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userId] = useAtom(userIdAtom);
  const [newMessage, setNewMessage] = useState('');
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const fetchMessages = useCallback(async () => {
    if (!roomId || !hasNext) return;

    setLoading(true);
    try {
      const {
        items,
        nextCursor,
        hasNext: newHasNext,
      } = await getMessages(parseInt(roomId, 10), cursor);
      setMessages((prev) => [...items, ...prev]); // Prepend old messages
      setCursor(nextCursor);
      setHasNext(newHasNext);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, cursor, hasNext]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMessages();
    }
  }, [isLoggedIn, fetchMessages]);

  useEffect(() => {
    if (!roomId || !userId) return;

    const client = createStompClient();
    clientRef.current = client;

    client.onConnect = () => {
      client.subscribe(`/sub/rooms/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [receivedMessage, ...prevMessages]);
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [roomId, userId]);

  const sendMessage = () => {
    if (clientRef.current && newMessage.trim() !== '' && roomId && userId) {
      const messageToSend = {
        text: newMessage,
      };
      clientRef.current.publish({
        destination: `/pub/rooms/${roomId}`,
        body: JSON.stringify(messageToSend),
      });
      setNewMessage('');
    }
  };

  return (
    <div className="chat-room-container">
      <div className="messages-container">
        {messages.map((msg, index) => {
          const isMyMessage = msg.senderId === userId;
          return (
            <div
              key={msg.id || `msg-${index}`}
              className={`message-bubble ${
                isMyMessage ? 'my-message' : 'other-message'
              }`}
            >
              <p className="message-text">{msg.text}</p>
              <span className="message-time">
                {new Date(msg.datetimeSendAt).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>
      <div className="message-input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
