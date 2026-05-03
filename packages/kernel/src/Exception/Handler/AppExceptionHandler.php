<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace TrueAdmin\Kernel\Exception\Handler;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Support\ApiResponse;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class AppExceptionHandler extends ExceptionHandler
{
    public function __construct(protected StdoutLoggerInterface $logger)
    {
    }

    public function handle(Throwable $throwable, ResponseInterface $response)
    {
        if ($throwable instanceof BusinessException) {
            $this->stopPropagation();

            return $response
                ->withHeader('Content-Type', 'application/json; charset=utf-8')
                ->withStatus($this->httpStatus($throwable->businessCode()))
                ->withBody(new SwooleStream(json_encode(
                    ApiResponse::fail($throwable->businessCode(), $throwable->getMessage()),
                    JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
                )));
        }

        $this->logger->error(sprintf('%s[%s] in %s', $throwable->getMessage(), $throwable->getLine(), $throwable->getFile()));
        $this->logger->error($throwable->getTraceAsString());
        $this->stopPropagation();

        return $response
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withStatus(500)
            ->withBody(new SwooleStream(json_encode(
                ApiResponse::fail(ErrorCode::SERVER_ERROR, '服务内部错误'),
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
            )));
    }

    public function isValid(Throwable $throwable): bool
    {
        return true;
    }

    private function httpStatus(int $businessCode): int
    {
        return match (true) {
            $businessCode >= 401000 && $businessCode < 402000 => 401,
            $businessCode >= 403000 && $businessCode < 404000 => 403,
            $businessCode >= 404000 && $businessCode < 405000 => 404,
            default => 400,
        };
    }
}
