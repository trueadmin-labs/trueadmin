import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  type AnimatedAttachment,
  attachmentMotionDuration,
  type TrueAdminAttachmentValue,
} from './attachmentUploadUtils';

export function useAttachmentUploadAnimation(value: TrueAdminAttachmentValue[]) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>();
  const [animatedFiles, setAnimatedFiles] = useState<AnimatedAttachment[]>(() =>
    value.map((file) => ({ file, phase: 'active' })),
  );

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return undefined;
    }

    const updateHeight = () => setContentHeight(element.scrollHeight);
    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setAnimatedFiles((previous) => {
      const incomingById = new Map(value.map((file) => [file.id, file]));
      const next: AnimatedAttachment[] = [];

      previous.forEach((item) => {
        const incoming = incomingById.get(item.file.id);
        if (incoming) {
          next.push({
            file: incoming,
            phase: item.phase === 'leave' ? 'enter' : item.phase,
          });
          incomingById.delete(item.file.id);
          return;
        }

        if (item.phase !== 'leave') {
          next.push({ ...item, phase: 'leave' });
        }
      });

      value.forEach((file) => {
        if (incomingById.has(file.id)) {
          next.push({ file, phase: 'enter' });
        }
      });

      return next;
    });
  }, [value]);

  useEffect(() => {
    if (!animatedFiles.some((item) => item.phase === 'enter')) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setAnimatedFiles((previous) =>
        previous.map((item) => (item.phase === 'enter' ? { ...item, phase: 'active' } : item)),
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [animatedFiles]);

  useEffect(() => {
    if (!animatedFiles.some((item) => item.phase === 'leave')) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setAnimatedFiles((previous) => previous.filter((item) => item.phase !== 'leave'));
    }, attachmentMotionDuration);

    return () => window.clearTimeout(timer);
  }, [animatedFiles]);

  return { animatedFiles, contentHeight, contentRef };
}
