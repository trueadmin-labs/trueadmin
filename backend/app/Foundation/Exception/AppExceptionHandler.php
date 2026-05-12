<?php

declare(strict_types=1);

namespace App\Foundation\Exception;

use TrueAdmin\Kernel\Http\ApiResponse;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Throwable;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

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
                ->withStatus($throwable->httpStatus())
                ->withBody(new SwooleStream(json_encode(
                    ApiResponse::fail($throwable->businessCode(), $throwable->getMessage(), $throwable->params() ?: null),
                    JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
            )));
        }

        if ($throwable instanceof ValidationException) {
            $this->stopPropagation();

            return $response
                ->withHeader('Content-Type', 'application/json; charset=utf-8')
                ->withStatus(422)
                ->withBody(new SwooleStream(json_encode(
                    ApiResponse::fail(ErrorCode::VALIDATION_FAILED->code(), ErrorCode::VALIDATION_FAILED->message(), $throwable->errors()),
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
                ApiResponse::fail(ErrorCode::SERVER_ERROR->code(), ErrorCode::SERVER_ERROR->message()),
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
            )));
    }

    public function isValid(Throwable $throwable): bool
    {
        return true;
    }
}
