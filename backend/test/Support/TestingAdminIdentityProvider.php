<?php

declare(strict_types=1);

namespace HyperfTest\Support;

use App\Foundation\Support\Password;
use App\Module\Auth\Http\Admin\Vo\AuthUser;
use App\Module\System\Contract\AdminIdentityProviderInterface;
use App\Module\System\Dto\AdminCredential;

final class TestingAdminIdentityProvider implements AdminIdentityProviderInterface
{
    public function findCredentialByUsername(string $username): ?AdminCredential
    {
        if ($username !== 'admin') {
            return null;
        }

        return new AdminCredential($this->admin(), Password::make('trueadmin'));
    }

    public function findAuthUserById(int $id): ?AuthUser
    {
        return $id === 1 ? $this->admin() : null;
    }

    private function admin(): AuthUser
    {
        return new AuthUser(1, 'admin', 'TrueAdmin', ['super-admin'], ['*']);
    }
}
