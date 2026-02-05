import { useAtom } from 'jotai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Message } from '../../api/room';
import { getMessages } from '../../api/room';
import { createStompClient } from '../../api/websocket';
import { isLoggedInAtom, userIdAtom } from '../../common/user';
import InfiniteScroll from '../../components/InfiniteScroll';
import './ChatRoom.css';
import type { Client } from '@stomp/stompjs';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [_readStatuses, setReadStatuses] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userId] = useAtom(userIdAtom);
  const [newMessage, setNewMessage] = useState('');
  const clientRef = useRef<Client | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const fetchMessages = useCallback(async () => {
    if (!roomId || !hasNext || loading) return;

    setLoading(true);
    try {
      const {
        items,
        nextCursor,
        hasNext: newHasNext,
        readStatuses: newReadStatuses,
      } = await getMessages(parseInt(roomId, 10), cursor);

      setMessages((prev) => [...prev, ...items]);
      setCursor(nextCursor);
      setHasNext(newHasNext);
      setReadStatuses(newReadStatuses);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, hasNext, cursor, loading]);

  useEffect(() => {
    if (isLoggedIn && roomId) {
      const fetchInitial = async () => {
        setLoading(true);
        try {
          const {
            items,
            nextCursor,
            hasNext: newHasNext,
            readStatuses: newReadStatuses,
          } = await getMessages(parseInt(roomId, 10), null);
          setMessages(items);
          setCursor(nextCursor);
          setHasNext(newHasNext);
          setReadStatuses(newReadStatuses);
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitial();
    }
  }, [isLoggedIn, roomId]);

  useLayoutEffect(() => {
    if (
      isInitialLoad.current &&
      scrollContainerRef.current &&
      messages.length > 0
    ) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!roomId || !isLoggedIn) return;

    const client = createStompClient();
    clientRef.current = client;

    client.onConnect = () => {
      client.subscribe(`/sub/rooms/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [receivedMessage, ...prevMessages]);
      });

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
      <div className="messages-container" ref={scrollContainerRef}>
        <InfiniteScroll
          className="message-list-wrapper"
          onEnd={fetchMessages}
          disabled={!hasNext || loading}
        >
          {messages.map((msg, index) => {
            const isMyMessage = msg.senderId === userId;
            const isBotMessage = msg.senderId === 7;
            return (
              <div
                key={msg.id || `msg-${index}`}
                className={`message-bubble ${
                  isMyMessage
                    ? 'my-message'
                    : isBotMessage
                      ? 'bot-message'
                      : 'other-message'
                }`}
              >
                <div className="message-content-wrapper">
                  {!isMyMessage && !isBotMessage && (
                    <div className="sender-info">
                      <img
                        src={
                          msg.senderProfileImageUrl ||
                          'https://via.placeholder.com/30'
                        }
                        alt={msg.senderUsername}
                        className="profile-picture"
                      />
                      <span className="sender-username">
                        {msg.senderUsername}
                      </span>
                    </div>
                  )}
                  <div className="message-content">
                    <p className="message-text">{msg.text}</p>
                  </div>
                </div>
                {!isBotMessage && (
                  <span className="message-time">
                    {new Date(msg.datetimeSendAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            );
          })}{' '}
        </InfiniteScroll>
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
