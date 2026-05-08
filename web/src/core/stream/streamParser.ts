import { StreamError } from './StreamError';
import type { StreamEventPayload } from './types';

export type ParsedStreamChunk = { type: 'event'; event: StreamEventPayload } | { type: 'done' };

export class SseDataParser {
  private buffer = '';

  push(chunk: string): ParsedStreamChunk[] {
    this.buffer += chunk;
    const frames = this.buffer.split(/\r?\n\r?\n/);
    this.buffer = frames.pop() ?? '';

    return frames.flatMap((frame) => this.parseFrame(frame));
  }

  flush(): ParsedStreamChunk[] {
    if (this.buffer.trim() === '') {
      this.buffer = '';
      return [];
    }

    const frame = this.buffer;
    this.buffer = '';

    return this.parseFrame(frame);
  }

  private parseFrame(frame: string): ParsedStreamChunk[] {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');

    if (data === '') {
      return [];
    }

    if (data === '[DONE]') {
      return [{ type: 'done' }];
    }

    try {
      const event = JSON.parse(data) as StreamEventPayload;
      if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
        throw new Error('Stream event requires a type field.');
      }

      return [{ type: 'event', event }];
    } catch (error) {
      throw new StreamError('protocol', '流式响应格式解析失败', 'STREAM.PROTOCOL', {
        data,
        error,
      });
    }
  }
}
