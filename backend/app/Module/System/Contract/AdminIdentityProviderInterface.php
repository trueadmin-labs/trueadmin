<?php

declare(strict_types=1);

namespace App\Module\System\Contract;

use App\Module\Auth\Http\Admin\Vo\AuthUser;
use App\Module\System\Dto\AdminCredential;

interface AdminIdentityProviderInterface
{
    public function findCredentialByUsername(string $username): ?AdminCredential;

    public function findAuthUserById(int $id): ?AuthUser;
}
