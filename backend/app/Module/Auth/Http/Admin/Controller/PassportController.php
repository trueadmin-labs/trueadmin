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

namespace App\Module\Auth\Http\Admin\Controller;

use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\Auth\Service\PassportService;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Http\ApiResponse;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Controller\AdminController;

#[AdminRouteController(path: '/api/admin/auth')]
final class PassportController extends AdminController
{
    public function __construct(private readonly PassportService $passportService)
    {
    }

    #[AdminPost('login')]
    public function login(): array
    {
        $username = trim((string) $this->request->input('username', ''));
        $password = (string) $this->request->input('password', '');

        if ($username === '' || $password === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, [
                'fields' => array_values(array_filter([
                    $username === '' ? 'username' : null,
                    $password === '' ? 'password' : null,
                ])),
            ]);
        }

        return ApiResponse::success($this->passportService->login(
            $username,
            $password,
            $this->request->getServerParams()['remote_addr'] ?? '',
            $this->request->getHeaderLine('User-Agent'),
        ));
    }

    #[AdminPost('logout', middleware: [AdminAuthMiddleware::class])]
    public function logout(): array
    {
        return ApiResponse::success(null);
    }

    #[AdminGet('me', middleware: [AdminAuthMiddleware::class])]
    public function me(): array
    {
        $actor = ActorContext::principal();
        if ($actor === null || $actor->type !== 'admin') {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401);
        }

        return ApiResponse::success([
            'id' => $actor->id,
            'username' => $actor->name,
            'nickname' => $actor->claims['nickname'] ?? $actor->name,
            'avatar' => $actor->claims['avatar'] ?? '',
            'roles' => $actor->claims['roles'] ?? [],
            'roleIds' => $actor->claims['roleIds'] ?? [],
            'effectiveRoles' => $actor->claims['roles'] ?? [],
            'permissions' => $actor->claims['permissions'] ?? [],
            'primaryDeptId' => $actor->claims['primaryDeptId'] ?? null,
            'deptIds' => $actor->claims['deptIds'] ?? [],
            'operationDeptId' => $actor->claims['operationDeptId'] ?? null,
            'preferences' => $actor->claims['preferences'] ?? [],
            'positions' => $actor->claims['positions'] ?? [],
            'directRoles' => $actor->claims['directRoles'] ?? [],
            'directRoleIds' => $actor->claims['directRoleIds'] ?? [],
            'positionRoles' => $this->positionRoleCodes($actor->claims['positionRoleBindings'] ?? []),
            'positionRoleBindings' => $actor->claims['positionRoleBindings'] ?? [],
        ]);
    }

    private function positionRoleCodes(mixed $bindings): array
    {
        if (! is_array($bindings)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map(static fn (mixed $binding): string => is_array($binding) ? (string) ($binding['roleCode'] ?? '') : '', $bindings),
            static fn (string $code): bool => $code !== '',
        )));
    }
}
