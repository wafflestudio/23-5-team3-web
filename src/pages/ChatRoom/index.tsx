import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
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
  const [_readStatuses, setReadStatuses] = useState<Record<number, number>>({});
  const [_loading, setLoading] = useState(true);
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

  // This useEffect will run once on mount to fetch initial messages.
  useEffect(() => {
    if (isLoggedIn && roomId) {
      const fetchInitialMessages = async () => {
        setLoading(true);
        try {
          const { items, readStatuses: newReadStatuses } = await getMessages(
            parseInt(roomId, 10),
            null
          );
          setMessages(items); // API returns newest first
          setReadStatuses(newReadStatuses);
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialMessages();
    }
  }, [isLoggedIn, roomId]);

  useEffect(() => {
    if (!roomId || !isLoggedIn) return;

    const client = createStompClient();
    clientRef.current = client;

    client.onConnect = () => {
      // Subscription for new messages
      client.subscribe(`/sub/rooms/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [receivedMessage, ...prevMessages]);
      });

      // Subscription for read status updates
      client.subscribe(`/sub/rooms/${roomId}/read`, (message) => {
        const { userId: readUserId, lastReadMessageId } = JSON.parse(
          message.body
        );
        setReadStatuses((prev) => ({
          ...prev,
          [readUserId]: lastReadMessageId,
        }));
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [roomId, isLoggedIn]);

  const sendMessage = () => {
    if (clientRef.current && newMessage.trim() !== '' && roomId) {
      const messageToSend = {
        text: newMessage,
      };
      clientRef.current.publish({
        destination: `/pub/rooms/${roomId}/messages`,
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
              <div className="message-content">
                <p className="message-text">{msg.text}</p>
                <span className="message-time">
                  {new Date(msg.datetimeSendAt).toLocaleTimeString()}
                </span>
              </div>
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
