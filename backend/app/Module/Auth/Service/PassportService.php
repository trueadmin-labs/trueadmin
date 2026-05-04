<?php

declare(strict_types=1);

namespace App\Module\Auth\Service;

use App\Module\Auth\Constant\AuthErrorCode;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;
use App\Foundation\Support\Password;
use App\Module\Auth\Http\Admin\Vo\AuthUser;
use App\Module\System\Contract\AdminIdentityProviderInterface;

final class PassportService
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly AdminIdentityProviderInterface $identities,
    )
    {
    }

    public function login(string $username, string $password): array
    {
        $credential = $this->identities->findCredentialByUsername($username);
        if ($credential === null || ! Password::verify($password, $credential->passwordHash)) {
            throw new BusinessException(AuthErrorCode::INVALID_CREDENTIALS, 401);
        }

        $user = $credential->user;

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
        $user = $this->identities->findAuthUserById((int) ($claims['sub'] ?? 0));
        if ($user === null) {
            throw new BusinessException(ErrorCode::UNAUTHORIZED, 401, ['reason' => 'admin_user_missing_or_disabled']);
        }

        return $user;
    }
}
