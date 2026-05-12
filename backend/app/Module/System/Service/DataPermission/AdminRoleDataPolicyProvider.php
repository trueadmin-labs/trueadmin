<?php

declare(strict_types=1);

namespace App\Module\System\Service\DataPermission;

use TrueAdmin\Kernel\DataPermission\DataPolicyProviderInterface;
use TrueAdmin\Kernel\DataPermission\DataPolicyRegistry;
use App\Module\System\Repository\AdminRoleDataPolicyRepository;
use App\Module\System\Repository\AdminRoleRepository;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\DataPermission\DataPolicyRule;

final class AdminRoleDataPolicyProvider implements DataPolicyProviderInterface
{
    public function __construct(
        private readonly AdminRoleRepository $roles,
        private readonly AdminRoleDataPolicyRepository $policies,
        private readonly DataPolicyRegistry $registry,
    ) {
    }

    public function policiesFor(Actor $actor, string $resource): array
    {
        if ($actor->type !== 'admin') {
            return [];
        }

        $roleCodes = $actor->claims['roles'] ?? [];
        if (is_array($roleCodes) && in_array('super-admin', $roleCodes, true)) {
            return $this->registry->allScopeRules();
        }

        $roleIds = $this->roleIds($actor);
        if ($roleIds === []) {
            return [];
        }

        return $this->policies->rulesForRoleIds($roleIds, $resource);
    }

    /**
     * @return list<int>
     */
    private function roleIds(Actor $actor): array
    {
        $roleIds = $actor->claims['roleIds'] ?? [];
        if (is_array($roleIds) && $roleIds !== []) {
            return array_values(array_unique(array_map('intval', $roleIds)));
        }

        $roleCodes = $actor->claims['roles'] ?? [];
        if (! is_array($roleCodes) || $roleCodes === []) {
            return [];
        }

        return $this->roles->idsByCodes(array_values(array_map('strval', $roleCodes)));
    }
}
