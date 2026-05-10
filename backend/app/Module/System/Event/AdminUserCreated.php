<?php

declare(strict_types=1);

namespace App\Module\System\Event;

final class AdminUserCreated
{
    /**
     * @param array<string, mixed> $user
     * @param list<int> $roleIds
     * @param list<int> $departmentIds
     */
    public function __construct(
        public readonly int $userId,
        public readonly array $user,
        public readonly array $roleIds,
        public readonly array $departmentIds,
        public readonly ?int $primaryDepartmentId,
    ) {
    }
}
