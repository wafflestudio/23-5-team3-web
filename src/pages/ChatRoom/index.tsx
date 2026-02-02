import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Message, Pot } from '../../api/room';
import { getMessages, getPotById, markAsRead } from '../../api/room';
import { createStompClient } from '../../api/websocket';
import { isLoggedInAtom, userIdAtom } from '../../common/user';
import './ChatRoom.css';
import type { Client } from '@stomp/stompjs';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pot, setPot] = useState<Pot | null>(null);
  const [readStatuses, setReadStatuses] = useState<Record<number, number>>({});
  const [_loading, setLoading] = useState(true);
  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userId, setUserId] = useAtom(userIdAtom);
  const [newMessage, setNewMessage] = useState('');
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (roomId) {
      markAsRead(parseInt(roomId, 10));
      getPotById(parseInt(roomId, 10)).then(setPot);
    }
  }, [roomId]);

  const fetchMessages = useCallback(async () => {
    if (!roomId || !hasNext) return;

    setLoading(true);
    try {
      const {
        items,
        nextCursor,
        hasNext: newHasNext,
        readStatuses: newReadStatuses,
      } = await getMessages(parseInt(roomId, 10), cursor);
      setMessages((prev) => [...items, ...prev]); // Prepend old messages
      setCursor(nextCursor);
      setHasNext(newHasNext);
      setReadStatuses(newReadStatuses);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: We don't want to re-run this effect when userId changes
  useEffect(() => {
    if (!roomId || !isLoggedIn) return;

    const client = createStompClient();
    clientRef.current = client;

    client.onConnect = () => {
      client.subscribe(`/sub/rooms/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        if (!userId) {
          setUserId(receivedMessage.senderId);
        }
        setMessages((prevMessages) => [receivedMessage, ...prevMessages]);
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
        destination: `/pub/rooms/${roomId}`,
        body: JSON.stringify(messageToSend),
      });
      setNewMessage('');
    }
  };

  const getUnreadCount = (messageId: number) => {
    if (!pot) return 0;

    const totalParticipants = pot.currentCount;
    let readCount = 0;
    for (const id in readStatuses) {
      if (parseInt(id) !== userId) {
        if (readStatuses[id] >= messageId) {
          readCount++;
        }
      }
    }
    // The sender has read their own message
    const unreadCount = totalParticipants - readCount - 1;
    return unreadCount > 0 ? unreadCount : 0;
  };

  return (
    <div className="chat-room-container">
      <div className="messages-container">
        {messages.map((msg, index) => {
          const isMyMessage = msg.senderId === userId;
          const unreadCount = getUnreadCount(msg.id);
          return (
            <div
              key={msg.id || `msg-${index}`}
              className={`message-bubble ${
                isMyMessage ? 'my-message' : 'other-message'
              }`}
            >
              {isMyMessage && unreadCount > 0 && (
                <span className="unread-count">{unreadCount}</span>
              )}
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
