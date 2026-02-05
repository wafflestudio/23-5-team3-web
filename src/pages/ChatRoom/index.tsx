import { useAtom } from 'jotai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Message } from '../../api/room';
import { getMessages, markAsRead } from '../../api/room';
import { createStompClient } from '../../api/websocket';
import { isLoggedInAtom, userIdAtom } from '../../common/user';
import './ChatRoom.css';
import type { Client } from '@stomp/stompjs';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // 상태 관리
  const [messages, setMessages] = useState<Message[]>([]);
  const [readStatuses, setReadStatuses] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);

  const [lastReadMessageIdOnEntry, setLastReadMessageIdOnEntry] = useState<
    number | null
  >(null);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);

  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userId] = useAtom(userIdAtom);

  const [newMessage, setNewMessage] = useState('');
  const clientRef = useRef<Client | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  const needsInitialScroll = useRef(true);
  const msgHistoryTick = useRef(false);

  // [수정: 마커 유지용] 초기 로딩이 완료되었는지 체크하는 Ref 추가
  const isInitialLoadComplete = useRef(false);

  const isAtBottomRef = useRef(true);

  const lastMessageIdRef = useRef<number | null>(null);

  const initialUnreadCount =
    (location.state as { unreadCount?: number })?.unreadCount || 0;
  const totalMembers =
    (location.state as { totalMembers?: number })?.totalMembers || 2;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const getUnreadCountForMessage = (msg: Message) => {
    const explicitReadersCount = Object.values(readStatuses).filter(
      (lastReadId) => lastReadId >= msg.id
    ).length;

    const senderLastRead = readStatuses[msg.senderId];
    const isSenderAlreadyCounted =
      senderLastRead !== undefined && senderLastRead >= msg.id;

    let finalReadCount = explicitReadersCount;
    if (!isSenderAlreadyCounted) {
      finalReadCount += 1;
    }

    return Math.max(0, totalMembers - finalReadCount);
  };

  // 1. 초기 데이터 로드 (반복 호출)
  useEffect(() => {
    if (isLoggedIn && roomId && userId) {
      const fetchInitial = async () => {
        setLoading(true);
        try {
          const targetCount =
            initialUnreadCount > 0 ? initialUnreadCount + 5 : 40;

          let collectedMessages: Message[] = [];
          let currentCursor: number | null = null;
          let keepFetching = true;

          let finalNextCursor: number | null = null;
          let finalHasNext = false;
          let finalReadStatuses: Record<number, number> = {};

          while (keepFetching && collectedMessages.length < targetCount) {
            // ================================================================
            // [수정: fetch 크기 동적 계산]
            // 목표치까지 남은 개수만큼만 가져오도록 계산 (최대 100개 제한)
            // 안 읽은게 없으면 40개만 가져옴.
            const remaining = targetCount - collectedMessages.length;
            const fetchSize = Math.min(100, remaining);
            // ================================================================

            const res = await getMessages(
              parseInt(roomId, 10),
              currentCursor,
              fetchSize // [수정] 계산된 fetchSize 적용
            );

            collectedMessages = [...collectedMessages, ...res.items];
            finalReadStatuses = { ...finalReadStatuses, ...res.readStatuses };

            currentCursor = res.nextCursor;
            finalNextCursor = res.nextCursor;
            finalHasNext = res.hasNext;

            if (!res.hasNext) {
              keepFetching = false;
            }
          }

          const sortedItems = [...collectedMessages].reverse();

          setMessages(sortedItems);
          setCursor(finalNextCursor);
          setHasNext(finalHasNext);
          setReadStatuses(finalReadStatuses);

          if (sortedItems.length > 0) {
            lastMessageIdRef.current = sortedItems[sortedItems.length - 1].id;
          }

          // ================================================================
          // [수정: 마커 유지 로직]
          // 초기 로딩이 아직 완료되지 않았을 때(최초 1회)만 마커 위치를 계산하고 저장함.
          // 이후 리렌더링이나 추가 로딩 시에는 이 값을 덮어쓰지 않음.
          if (!isInitialLoadComplete.current) {
            const myLastReadId = finalReadStatuses[userId] || 0;
            const lastMessageId =
              sortedItems.length > 0
                ? sortedItems[sortedItems.length - 1].id
                : 0;

            if (myLastReadId >= lastMessageId) {
              setLastReadMessageIdOnEntry(null);
            } else {
              setLastReadMessageIdOnEntry(myLastReadId);
            }
            // 마커 계산 완료 표시 (이제 다시는 이 블록에 들어오지 않음)
            isInitialLoadComplete.current = true;
          }
          // ================================================================

          if (sortedItems.length > 0) {
            markAsRead(
              parseInt(roomId, 10),
              sortedItems[sortedItems.length - 1].id
            );
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitial();
    }
  }, [isLoggedIn, roomId, userId, initialUnreadCount]);

  // 2. 초기 스크롤 위치
  useLayoutEffect(() => {
    // [수정 2] messages.length > 0 조건을 명시하여 messages 의존성 사용 처리
    if (
      messages.length > 0 &&
      !loading &&
      needsInitialScroll.current &&
      scrollContainerRef.current
    ) {
      const container = scrollContainerRef.current;
      const markerElement = container.querySelector('.unread-marker');

      if (markerElement) {
        markerElement.scrollIntoView({ block: 'center' });
        isAtBottomRef.current = false;
      } else {
        container.scrollTop = container.scrollHeight;
        isAtBottomRef.current = true;
      }

      needsInitialScroll.current = false;
      setIsReady(true);
    } else if (!loading && messages.length === 0) {
      setIsReady(true);
    }
  }, [loading, messages]);

  // 3. 무한 스크롤
  const fetchMoreMessages = useCallback(async () => {
    if (!roomId || !hasNext || fetchingMore || loading) return;

    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.style.overflowY = 'hidden';
    }

    setFetchingMore(true);

    try {
      const {
        items,
        nextCursor,
        hasNext: newHasNext,
        readStatuses: newReadStatuses,
      } = await getMessages(parseInt(roomId, 10), cursor, 40);

      const sortedOlderItems = [...items].reverse();
      msgHistoryTick.current = true;

      setMessages((prev) => [...sortedOlderItems, ...prev]);
      setCursor(nextCursor);
      setHasNext(newHasNext);
      setReadStatuses((prev) => ({ ...prev, ...newReadStatuses }));
    } catch (error) {
      console.error('Error fetching more messages:', error);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.overflowY = 'auto';
      }
      setFetchingMore(false);
    }
  }, [roomId, hasNext, cursor, fetchingMore, loading]);

  useLayoutEffect(() => {
    // [수정 2] messages.length 조건을 사용하여 의존성 경고 해결
    if (
      messages.length > 0 &&
      scrollContainerRef.current &&
      msgHistoryTick.current
    ) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;

      if (diff > 0) {
        container.scrollTop = diff;
      }

      container.style.overflowY = 'auto';
      setFetchingMore(false);
      msgHistoryTick.current = false;
    }
  }, [messages]);

  // 메시지 수신 시 처리
  useEffect(() => {
    if (
      isReady &&
      !fetchingMore &&
      messages.length > 0 &&
      scrollContainerRef.current
    ) {
      const lastMsg = messages[messages.length - 1];

      if (lastMsg.id !== lastMessageIdRef.current) {
        const isMyMessage = lastMsg.senderId === userId;
        const wasAtBottom = isAtBottomRef.current;

        if (isMyMessage || wasAtBottom) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
          setShowNewMessageAlert(false);
          isAtBottomRef.current = true;
        } else {
          setShowNewMessageAlert(true);
        }

        lastMessageIdRef.current = lastMsg.id;
      }
    }
  }, [messages, isReady, fetchingMore, userId]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;

      if (scrollTop === 0 && hasNext && !fetchingMore && isReady) {
        fetchMoreMessages();
      }

      const isBottom = scrollHeight - scrollTop - clientHeight < 150;
      isAtBottomRef.current = isBottom;

      if (isBottom) {
        setShowNewMessageAlert(false);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      setShowNewMessageAlert(false);
      isAtBottomRef.current = true;
    }
  };

  // WebSocket
  // [수정 3] userId 의존성 제거 (내부에서 안 씀)
  useEffect(() => {
    if (!roomId || !isLoggedIn) return;
    const client = createStompClient();
    clientRef.current = client;

    client.onConnect = () => {
      client.subscribe(`/sub/rooms/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);

        markAsRead(parseInt(roomId, 10), receivedMessage.id);
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
  }, [roomId, isLoggedIn]); // userId 제거됨

  // [수정 1] async 제거
  const sendMessage = () => {
    if (clientRef.current && newMessage.trim() !== '' && roomId) {
      const messageToSend = { text: newMessage };
      clientRef.current.publish({
        destination: `/pub/rooms/${roomId}/messages`,
        body: JSON.stringify(messageToSend),
      });
      setNewMessage('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (!isReady) {
    return (
      <div className="chat-room-container loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="chat-room-container">
      <div
        className="messages-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {fetchingMore && (
          <div className="loading-indicator">
            <div className="spinner"></div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMyMessage = msg.senderId === userId;
          const isBotMessage = msg.senderId === 7;

          const currentDate = formatDate(msg.datetimeSendAt);
          const prevDate =
            index > 0 ? formatDate(messages[index - 1].datetimeSendAt) : null;
          const showDateSeparator = currentDate !== prevDate;

          let showUnreadMarker = false;
          if (lastReadMessageIdOnEntry !== null) {
            const prevMsgId = index > 0 ? messages[index - 1].id : 0;
            if (prevMsgId === lastReadMessageIdOnEntry) {
              showUnreadMarker = true;
            }
            if (index === 0 && msg.id > lastReadMessageIdOnEntry) {
              showUnreadMarker = true;
            }
          }

          const unreadCount = getUnreadCountForMessage(msg);

          return (
            <div key={msg.id || `msg-${index}`}>
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{currentDate}</span>
                </div>
              )}

              {showUnreadMarker && (
                <div className="unread-marker">
                  <span>여기까지 읽으셨습니다</span>
                </div>
              )}

              <div
                className={`message-bubble ${
                  isMyMessage
                    ? 'my-message'
                    : isBotMessage
                      ? 'bot-message'
                      : 'other-message'
                }`}
              >
                {!isMyMessage && !isBotMessage && (
                  <div className="profile-column">
                    <img
                      src={
                        msg.senderProfileImageUrl ||
                        'https://via.placeholder.com/40'
                      }
                      alt={msg.senderUsername}
                      className="profile-picture"
                    />
                  </div>
                )}

                <div className="message-content-wrapper">
                  {!isMyMessage && !isBotMessage && (
                    <span className="sender-username">
                      {msg.senderUsername}
                    </span>
                  )}

                  <div className="message-row">
                    {isMyMessage && (
                      <div className="message-meta">
                        {unreadCount > 0 && (
                          <span className="unread-count">{unreadCount}</span>
                        )}
                        <span className="message-time">
                          {new Date(msg.datetimeSendAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    <div className="message-content">
                      <p className="message-text">{msg.text}</p>
                    </div>

                    {!isMyMessage && !isBotMessage && (
                      <div className="message-meta">
                        {unreadCount > 0 && (
                          <span className="unread-count">{unreadCount}</span>
                        )}
                        <span className="message-time">
                          {new Date(msg.datetimeSendAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNewMessageAlert && (
        <div className="new-message-alert" onClick={scrollToBottom}>
          ⬇ 새로운 메시지
        </div>
      )}

      <div className="message-input-container">
        <input
          type="text"
          placeholder="메시지 보내기"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="send-button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
              fill="white"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
