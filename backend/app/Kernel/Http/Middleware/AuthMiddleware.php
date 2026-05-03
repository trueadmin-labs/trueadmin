<?php

declare(strict_types=1);

namespace App\Kernel\Http\Middleware;

use App\Kernel\Constant\ErrorCode;
use App\Kernel\Exception\BusinessException;
use App\Module\Auth\Service\AuthService;
use Hyperf\Context\Context;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AuthMiddleware implements MiddlewareInterface
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authorization = $request->getHeaderLine('Authorization');
        if (! str_starts_with($authorization, 'Bearer ')) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, '请先登录');
        }

        $token = trim(substr($authorization, 7));
        if ($token === '') {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, '请先登录');
        }

        Context::set('auth.user', $this->authService->userFromToken($token));

        return $handler->handle($request);
    }
}
