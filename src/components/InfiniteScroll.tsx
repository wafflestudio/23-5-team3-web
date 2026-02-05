import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  type JSX,
  useState,
} from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

type InfiniteScrollEndHandler = () => void;

interface InfiniteScrollProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  /**
   * 비활성화 여부
   */
  disabled?: boolean;

  /**
   * 마진
   */
  rootMargin?: string;

  /**
   * 스크롤 끝 이벤트 메서드
   */
  onEnd?: InfiniteScrollEndHandler;
}

export default function InfiniteScroll({
  disabled,
  rootMargin,
  onEnd,
  children,
  ...props
}: InfiniteScrollProps): JSX.Element {
  const [domState, setDomState] = useState<HTMLDivElement | null>(null);

  useIntersectionObserver(
    domState,
    (entry) => {
      // DOM이 보일 경우
      if (entry.isIntersecting) {
        onEnd?.();
      }
    },
    { rootMargin }
  );

  return (
    <div {...props}>
      {children}

      {children && !disabled ? (
        <div ref={setDomState} style={{ width: '100%' }} />
      ) : null}
    </div>
  );
}
