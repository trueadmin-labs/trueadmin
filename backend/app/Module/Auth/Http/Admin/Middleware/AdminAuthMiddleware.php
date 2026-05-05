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
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'missing_bearer_token']);
        }

        $token = trim(substr($authorization, 7));
        if ($token === '') {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'empty_bearer_token']);
        }

        $user = $this->passportService->userFromToken($token);
        $operationDeptId = $this->operationDeptId($request->getHeaderLine('X-Operation-Dept-Id'), $user->deptIds, $user->primaryDeptId);
        ActorContext::set(ActorFactory::fromAdmin(
            id: $user->id,
            username: $user->username,
            nickname: $user->nickname,
            roles: $user->roles,
            permissions: $user->permissions,
            primaryDeptId: $user->primaryDeptId,
            deptIds: $user->deptIds,
            operationDeptId: $operationDeptId,
        ));

        return $handler->handle($request);
    }

    private function operationDeptId(string $header, array $deptIds, ?int $primaryDeptId): ?int
    {
        $operationDeptId = trim($header) === '' ? $primaryDeptId : (int) trim($header);
        if ($operationDeptId === null || $operationDeptId <= 0) {
            return null;
        }
        if (! in_array($operationDeptId, $deptIds, true)) {
            throw new BusinessException(ErrorCode::FORBIDDEN, 403, ['reason' => 'operation_dept_not_assigned']);
        }

        return $operationDeptId;
    }
}
