<?php

declare(strict_types=1);

namespace Plugin\TrueAdmin\Examples\Service;

use App\Foundation\Stream\StreamProgress;

final class StreamDemoService
{
    /**
     * @return array{items: list<array{name: string, status: string}>, total: int}
     */
    public function runProgressDemo(): array
    {
        $steps = [
            ['module' => 'examples.stream', 'stage' => 'prepare', 'message' => '准备演示上下文'],
            ['module' => 'examples.stream', 'stage' => 'validate', 'message' => '校验请求参数'],
            ['module' => 'examples.stream', 'stage' => 'process', 'message' => '模拟批量处理数据'],
            ['module' => 'examples.stream', 'stage' => 'finalize', 'message' => '整理最终响应结果'],
        ];

        $items = [];
        $total = count($steps);

        foreach ($steps as $index => $step) {
            $current = $index + 1;
            StreamProgress::progress(
                message: $step['message'],
                module: $step['module'],
                stage: $step['stage'],
                current: $current,
                total: $total,
                percent: (int) floor($current / $total * 100),
            );

            usleep(150_000);
            $items[] = [
                'name' => $step['stage'],
                'status' => 'done',
            ];
        }

        StreamProgress::debug('示例插件流式演示执行完成', ['items' => count($items)], 'examples.stream');

        return [
            'items' => $items,
            'total' => $total,
        ];
    }
}
