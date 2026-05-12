<?php

declare(strict_types=1);

namespace App\Foundation\DataPermission\Organization;

use TrueAdmin\Kernel\Context\Actor;

interface OrganizationScopeProviderInterface
{
    public function operationDepartmentId(Actor $actor): ?int;

    /**
     * @param int|list<int> $ids
     * @return list<int>
     */
    public function selfAndDescendantDepartmentIds(int|array $ids): array;
}
