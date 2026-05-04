<?php

declare(strict_types=1);

namespace App\Module\Auth\Http\Admin\Controller;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;
use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use TrueAdmin\Kernel\Context\ActorContext;
use App\Module\Auth\Service\PassportService;

final class PassportController extends AdminController
{
    public function __construct(private readonly PassportService $passportService)
    {
    }

    public function login(): array
    {
        $username = trim((string) $this->request->input('username', ''));
        $password = (string) $this->request->input('password', '');

        if ($username === '' || $password === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, '用户名和密码不能为空');
        }

        return ApiResponse::success($this->passportService->login($username, $password));
    }

    public function logout(): array
    {
        return ApiResponse::success(null);
    }

    public function me(): array
    {
        $actor = ActorContext::principal();
        if ($actor === null || $actor->type !== 'admin') {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, '请先登录');
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
