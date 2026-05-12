<?php

declare(strict_types=1);

namespace Plugin\TrueAdmin\Examples\Service;

use TrueAdmin\Kernel\Stream\StreamProgress;

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
            ['module' => 'examples.stream', 'stage' => 'load-config', 'message' => '加载插件配置'],
            ['module' => 'examples.stream', 'stage' => 'connect', 'message' => '连接外部服务'],
            ['module' => 'examples.stream', 'stage' => 'fetch', 'message' => '拉取演示数据'],
            ['module' => 'examples.stream', 'stage' => 'normalize', 'message' => '标准化数据结构'],
            ['module' => 'examples.stream', 'stage' => 'process', 'message' => '模拟批量处理数据'],
            ['module' => 'examples.stream', 'stage' => 'aggregate', 'message' => '汇总阶段结果'],
            ['module' => 'examples.stream', 'stage' => 'persist', 'message' => '模拟保存处理记录'],
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

            usleep(650_000);
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
