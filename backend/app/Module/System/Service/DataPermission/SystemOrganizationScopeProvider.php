<?php

declare(strict_types=1);

namespace App\Module\System\Service\DataPermission;

use App\Foundation\DataPermission\Organization\OrganizationScopeProviderInterface;
use App\Module\System\Repository\AdminDepartmentRepository;
use TrueAdmin\Kernel\Context\Actor;

final class SystemOrganizationScopeProvider implements OrganizationScopeProviderInterface
{
    public function __construct(private readonly AdminDepartmentRepository $departments)
    {
    }

    public function operationDepartmentId(Actor $actor): ?int
    {
        $operationDeptId = (int) ($actor->claims['operationDeptId'] ?? 0);

        return $operationDeptId > 0 ? $operationDeptId : null;
    }

    public function selfAndDescendantDepartmentIds(int|array $ids): array
    {
        return $this->departments->selfAndDescendantIds($ids);
    }
}
