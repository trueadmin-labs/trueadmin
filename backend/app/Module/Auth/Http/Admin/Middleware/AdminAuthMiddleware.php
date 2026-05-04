<?php

declare(strict_types=1);

namespace App\Module\Auth\Http\Admin\Middleware;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;
use App\Foundation\Auth\ActorFactory;
use App\Module\Auth\Service\PassportService;
use Psr\Http\Message\ResponseInterface;
use TrueAdmin\Kernel\Context\ActorContext;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class AdminAuthMiddleware implements MiddlewareInterface
{
    public function __construct(private readonly PassportService $passportService)
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

        $user = $this->passportService->userFromToken($token);
        ActorContext::set(ActorFactory::fromAdmin($user));

        return $handler->handle($request);
    }
}
