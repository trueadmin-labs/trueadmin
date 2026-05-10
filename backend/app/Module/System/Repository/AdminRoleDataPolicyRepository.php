<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminRole;
use App\Module\System\Model\AdminRoleDataPolicy;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\DataPermission\DataPolicyRule;

final class AdminRoleDataPolicyRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminRoleDataPolicy::class;

    /**
     * @param list<int> $roleIds
     * @return list<DataPolicyRule>
     */
    public function rulesForRoleIds(array $roleIds, string $resource, string $action): array
    {
        if ($roleIds === []) {
            return [];
        }

        return AdminRoleDataPolicy::query()
            ->whereIn('role_id', array_values(array_unique($roleIds)))
            ->where('status', 'enabled')
            ->where('resource', $resource)
            ->where('action', $action)
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(static fn (AdminRoleDataPolicy $policy): DataPolicyRule => self::toRule($policy))
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function policiesForRole(AdminRole $role): array
    {
        return AdminRoleDataPolicy::query()
            ->where('role_id', (int) $role->getAttribute('id'))
            ->orderBy('sort')
            ->orderBy('id')
            ->get()
            ->map(static fn (AdminRoleDataPolicy $policy): array => self::toArray($policy))
            ->all();
    }

    /**
     * @param list<array<string, mixed>> $policies
     */
    public function syncRolePolicies(AdminRole $role, array $policies): void
    {
        $roleId = (int) $role->getAttribute('id');
        Db::table('admin_role_data_policies')->where('role_id', $roleId)->delete();

        $now = date('Y-m-d H:i:s');
        foreach (array_values($policies) as $index => $policy) {
            Db::table('admin_role_data_policies')->insert([
                'role_id' => $roleId,
                'resource' => (string) $policy['resource'],
                'action' => (string) $policy['action'],
                'strategy' => (string) ($policy['strategy'] ?? 'organization'),
                'effect' => (string) ($policy['effect'] ?? 'allow'),
                'scope' => (string) ($policy['scope'] ?? 'self'),
                'config' => json_encode((array) ($policy['config'] ?? []), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'status' => (string) ($policy['status'] ?? 'enabled'),
                'sort' => (int) ($policy['sort'] ?? $index),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function deleteByRoleId(int $roleId): void
    {
        Db::table('admin_role_data_policies')->where('role_id', $roleId)->delete();
    }

    private static function toRule(AdminRoleDataPolicy $policy): DataPolicyRule
    {
        return new DataPolicyRule(
            resource: (string) $policy->getAttribute('resource'),
            action: (string) $policy->getAttribute('action'),
            strategy: (string) $policy->getAttribute('strategy'),
            scope: (string) $policy->getAttribute('scope'),
            effect: (string) $policy->getAttribute('effect'),
            config: (array) ($policy->getAttribute('config') ?? []),
            roleId: (int) $policy->getAttribute('role_id'),
            sort: (int) $policy->getAttribute('sort'),
        );
    }

    private static function toArray(AdminRoleDataPolicy $policy): array
    {
        return [
            'id' => (int) $policy->getAttribute('id'),
            'roleId' => (int) $policy->getAttribute('role_id'),
            'resource' => (string) $policy->getAttribute('resource'),
            'action' => (string) $policy->getAttribute('action'),
            'strategy' => (string) $policy->getAttribute('strategy'),
            'effect' => (string) $policy->getAttribute('effect'),
            'scope' => (string) $policy->getAttribute('scope'),
            'config' => (array) ($policy->getAttribute('config') ?? []),
            'status' => (string) $policy->getAttribute('status'),
            'sort' => (int) $policy->getAttribute('sort'),
        ];
    }
}
