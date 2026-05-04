<?php

declare(strict_types=1);

namespace App\Module\User\Http\Client\Middleware;

use App\Foundation\Auth\ActorFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use TrueAdmin\Kernel\Context\ActorContext;

final class ClientActorMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $clientUserId = (int) ($request->getHeaderLine('X-Client-User-Id') ?: 10001);
        $clientUserName = $request->getHeaderLine('X-Client-User-Name') ?: 'Client User';

        ActorContext::set(ActorFactory::fromClient($clientUserId, $clientUserName, [
            'scopes' => ['profile:read'],
        ]));

        return $handler->handle($request);
    }
}
