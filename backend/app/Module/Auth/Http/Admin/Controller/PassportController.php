<?php

declare(strict_types=1);

namespace App\Module\Auth\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\Auth\Service\PassportService;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;

#[AdminRouteController(prefix: 'auth')]
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

        return ApiResponse::success($this->passportService->login($username, $password));
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
            'roles' => $actor->claims['roles'] ?? [],
            'permissions' => $actor->claims['permissions'] ?? [],
        ]);
    }
}
