<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Module\Auth\Http\Admin\Vo\AuthUser;
use App\Module\System\Contract\AdminIdentityProviderInterface;
use App\Module\System\Dto\AdminCredential;
use App\Module\System\Model\AdminUser;
use App\Module\System\Repository\AdminUserRepository;

final class AdminIdentityService implements AdminIdentityProviderInterface
{
    public function __construct(private readonly AdminUserRepository $users)
    {
    }

    public function findCredentialByUsername(string $username): ?AdminCredential
    {
        $user = $this->users->findEnabledByUsername($username);
        if ($user === null) {
            return null;
        }

        return new AdminCredential($this->toAuthUser($user), (string) $user->getAttribute('password'));
    }

    public function findAuthUserById(int $id): ?AuthUser
    {
        $user = $this->users->findEnabledById($id);
        if ($user === null) {
            return null;
        }

        return $this->toAuthUser($user);
    }

    public function toAuthUser(AdminUser $user): AuthUser
    {
        return new AuthUser(
            (int) $user->getAttribute('id'),
            (string) $user->getAttribute('username'),
            (string) $user->getAttribute('nickname'),
            $this->users->roleCodes($user),
            $this->users->permissions($user),
            $user->getAttribute('primary_dept_id') === null ? null : (int) $user->getAttribute('primary_dept_id'),
            $this->users->departmentIds($user),
        );
    }
}
