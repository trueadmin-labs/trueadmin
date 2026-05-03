<?php

declare(strict_types=1);

namespace App\Module\Auth\Service\Admin;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Support\Password;
use App\Module\Auth\Domain\DTO\AuthUser;
use App\Module\Auth\Domain\Service\JwtService;

final class AuthService
{
    /**
     * The first backend stage uses an in-memory admin account. This keeps the
     * JWT contract runnable before the user module and migrations exist.
     */
    private const ADMIN = [
        'id' => 1,
        'username' => 'admin',
        'password' => '$2y$10$ysOpeUAW7srRQEatZhkGAutDjsKJaX9VdYJPukCPfrnOM0Yc7g5kK',
        'nickname' => 'TrueAdmin',
        'roles' => ['super-admin'],
        'permissions' => ['*'],
    ];

    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function login(string $username, string $password): array
    {
        if ($username !== self::ADMIN['username'] || ! Password::verify($password, self::ADMIN['password'])) {
            throw new BusinessException(ErrorCode::INVALID_CREDENTIALS, '用户名或密码错误');
        }

        $user = $this->adminUser();

        return [
            'tokenType' => 'Bearer',
            'accessToken' => $this->jwtService->issue([
                'sub' => $user->id,
                'username' => $user->username,
                'aud' => 'admin',
            ]),
            'expiresIn' => 7200,
            'user' => $user->toArray(),
        ];
    }

    public function userFromToken(string $token): AuthUser
    {
        $claims = $this->jwtService->parse($token);
        if ((int) ($claims['sub'] ?? 0) !== self::ADMIN['id']) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, '用户不存在或已禁用');
        }

        return $this->adminUser();
    }

    private function adminUser(): AuthUser
    {
        return new AuthUser(
            self::ADMIN['id'],
            self::ADMIN['username'],
            self::ADMIN['nickname'],
            self::ADMIN['roles'],
            self::ADMIN['permissions'],
        );
    }
}
