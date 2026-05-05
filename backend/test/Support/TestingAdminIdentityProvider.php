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
        $user = $this->users()[$username] ?? null;
        if ($user === null) {
            return null;
        }

        return new AdminCredential($user, Password::make('trueadmin'));
    }

    public function findAuthUserById(int $id): ?AuthUser
    {
        foreach ($this->users() as $user) {
            if ($user->id === $id) {
                return $user;
            }
        }

        return null;
    }

    /**
     * @return array<string, AuthUser>
     */
    private function users(): array
    {
        return [
            'admin' => new AuthUser(1, 'admin', 'TrueAdmin', ['super-admin'], ['*'], 1, [1]),
            'permission-any-a' => new AuthUser(2, 'permission-any-a', 'Permission Any A', ['tester'], ['testing:permission:any-a'], 1, [1]),
            'permission-all-a' => new AuthUser(3, 'permission-all-a', 'Permission All A', ['tester'], ['testing:permission:all-a'], 1, [1]),
            'permission-all-ab' => new AuthUser(4, 'permission-all-ab', 'Permission All AB', ['tester'], ['testing:permission:all-a', 'testing:permission:all-b'], 1, [1]),
        ];
    }
}
