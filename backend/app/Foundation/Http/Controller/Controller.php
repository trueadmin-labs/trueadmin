<?php

declare(strict_types=1);

namespace App\Foundation\Http\Controller;

use App\Foundation\Stream\SseStreamResponder;
use Psr\Http\Message\ResponseInterface;
use TrueAdmin\Kernel\Http\Controller\AbstractController;

abstract class Controller extends AbstractController
{
    /**
     * @template TReturn
     * @param callable(): TReturn $handler
     */
    protected function stream(callable $handler, string $completedMessage = '处理完成'): ResponseInterface
    {
        return $this->container->get(SseStreamResponder::class)->run($handler, $completedMessage);
    }
}
