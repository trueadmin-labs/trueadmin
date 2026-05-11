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

        return new AdminCredential($user, Password::make('123456'));
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
            'trueadmin' => new AuthUser(1, 'trueadmin', 'TrueAdmin', '', ['super-admin'], [1], ['*'], 1, [1], []),
            'admin' => new AuthUser(2, 'admin', 'Admin', '', ['admin'], [2], ['*'], 1, [1], []),
            'permission-any-a' => new AuthUser(3, 'permission-any-a', 'Permission Any A', '', ['tester'], [3], ['testing:permission:any-a'], 1, [1], []),
            'permission-all-a' => new AuthUser(4, 'permission-all-a', 'Permission All A', '', ['tester'], [3], ['testing:permission:all-a'], 1, [1], []),
            'permission-all-ab' => new AuthUser(5, 'permission-all-ab', 'Permission All AB', '', ['tester'], [3], ['testing:permission:all-a', 'testing:permission:all-b'], 1, [1], []),
        ];
    }
}
