<?php

declare(strict_types=1);

namespace App\Module\Auth\Controller;

use App\Kernel\Constant\ErrorCode;
use App\Kernel\Exception\BusinessException;
use App\Kernel\Http\Controller\AbstractController;
use App\Kernel\Support\ApiResponse;
use App\Module\Auth\DTO\AuthUser;
use App\Module\Auth\Service\AuthService;
use Hyperf\Context\Context;

final class AuthController extends AbstractController
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function login(): array
    {
        $username = trim((string) $this->request->input('username', ''));
        $password = (string) $this->request->input('password', '');

        if ($username === '' || $password === '') {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, '用户名和密码不能为空');
        }

        return ApiResponse::success($this->authService->login($username, $password));
    }

    public function logout(): array
    {
        return ApiResponse::success(null);
    }

    public function me(): array
    {
        $user = Context::get('auth.user');
        if (! $user instanceof AuthUser) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, '请先登录');
        }

        return ApiResponse::success($user->toArray());
    }
}
