<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\System\Service\DataPermission;

use App\Module\System\Repository\AdminRoleDataPolicyRepository;
use App\Module\System\Repository\AdminRoleRepository;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\DataPermission\DataPolicyProviderInterface;
use TrueAdmin\Kernel\DataPermission\DataPolicyRegistry;
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

        $rules = [];
        $directRoleIds = $this->directRoleIds($actor);
        if ($directRoleIds !== []) {
            $rules = array_merge($rules, $this->policies->rulesForRoleIds($directRoleIds, $resource));
        }

        foreach ($this->positionRoleBindings($actor) as $binding) {
            $roleId = (int) ($binding['roleId'] ?? 0);
            $deptId = (int) ($binding['deptId'] ?? 0);
            $positionId = (int) ($binding['positionId'] ?? 0);
            if ($roleId <= 0 || $deptId <= 0 || $positionId <= 0) {
                continue;
            }

            foreach ($this->policies->rulesForRoleIds([$roleId], $resource) as $rule) {
                $rules[] = new DataPolicyRule(
                    resource: $rule->resource,
                    strategy: $rule->strategy,
                    scope: $rule->scope,
                    effect: $rule->effect,
                    config: [
                        ...$rule->config,
                        '_context' => [
                            'source' => 'position',
                            'positionId' => $positionId,
                            'deptId' => $deptId,
                        ],
                    ],
                    roleId: $rule->roleId,
                    sort: $rule->sort,
                );
            }
        }

        if ($rules === []) {
            return [];
        }

        return $rules;
    }

    /**
     * @return list<int>
     */
    private function directRoleIds(Actor $actor): array
    {
        if (array_key_exists('directRoleIds', $actor->claims)) {
            $roleIds = $actor->claims['directRoleIds'];

            return is_array($roleIds)
                ? array_values(array_unique(array_filter(array_map('intval', $roleIds), static fn (int $id): bool => $id > 0)))
                : [];
        }

        if (array_key_exists('positionRoleBindings', $actor->claims)) {
            return [];
        }

        $roleIds = $actor->claims['roleIds'] ?? [];
        if (is_array($roleIds) && $roleIds !== []) {
            return array_values(array_unique(array_filter(array_map('intval', $roleIds), static fn (int $id): bool => $id > 0)));
        }

        $roleCodes = $actor->claims['roles'] ?? [];
        if (! is_array($roleCodes) || $roleCodes === []) {
            return [];
        }

        return $this->roles->idsByCodes(array_values(array_map('strval', $roleCodes)));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function positionRoleBindings(Actor $actor): array
    {
        $bindings = $actor->claims['positionRoleBindings'] ?? [];

        return is_array($bindings) ? array_values(array_filter($bindings, 'is_array')) : [];
    }
}
