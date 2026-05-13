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

namespace App\Module\Auth\Http\Admin\Middleware;

use App\Module\Auth\Service\PassportService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

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
        ActorContext::set(new Actor(
            type: 'admin',
            id: $user->id,
            name: $user->username,
            source: 'http',
            claims: [
                'nickname' => $user->nickname,
                'avatar' => $user->avatar,
                'roles' => $user->roles,
                'roleIds' => $user->roleIds,
                'permissions' => $user->permissions,
                'primaryDeptId' => $user->primaryDeptId,
                'deptIds' => $user->deptIds,
                'operationDeptId' => $operationDeptId,
                'preferences' => $user->preferences,
                'positions' => $user->positions,
                'directRoles' => $user->directRoles,
                'directRoleIds' => $user->directRoleIds,
                'positionRoleBindings' => $user->positionRoleBindings,
            ],
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
