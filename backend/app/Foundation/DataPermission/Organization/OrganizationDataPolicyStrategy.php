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

namespace App\Foundation\DataPermission\Organization;

use Hyperf\Database\Model\Builder as ModelBuilder;
use Hyperf\Database\Query\Builder as QueryBuilder;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\DataPermission\DataPolicyRule;
use TrueAdmin\Kernel\DataPermission\DataPolicyStrategyInterface;
use TrueAdmin\Kernel\DataPermission\DataPolicyTarget;

final class OrganizationDataPolicyStrategy implements DataPolicyStrategyInterface
{
    public function __construct(private readonly OrganizationScopeProviderInterface $scopeProvider)
    {
    }

    public function key(): string
    {
        return 'organization';
    }

    public function metadata(): array
    {
        return [
            'key' => 'organization',
            'label' => '组织范围',
            'i18n' => 'dataPolicy.strategy.organization',
            'scopes' => [
                ['key' => 'all', 'label' => '全部数据', 'i18n' => 'dataPolicy.scope.all', 'sort' => 10],
                ['key' => 'department', 'label' => '本部门', 'i18n' => 'dataPolicy.scope.department', 'sort' => 20],
                ['key' => 'department_and_children', 'label' => '本部门及子部门', 'i18n' => 'dataPolicy.scope.departmentAndChildren', 'sort' => 30],
                ['key' => 'self', 'label' => '仅本人', 'i18n' => 'dataPolicy.scope.self', 'sort' => 40],
                ['key' => 'custom_departments', 'label' => '自定义部门', 'i18n' => 'dataPolicy.scope.customDepartments', 'sort' => 50, 'configSchema' => [
                    ['key' => 'deptIds', 'type' => 'department_tree', 'label' => '可见部门', 'i18n' => 'dataPolicy.config.deptIds'],
                ]],
                ['key' => 'custom_departments_and_children', 'label' => '自定义部门及子部门', 'i18n' => 'dataPolicy.scope.customDepartmentsAndChildren', 'sort' => 60, 'configSchema' => [
                    ['key' => 'deptIds', 'type' => 'department_tree', 'label' => '可见部门', 'i18n' => 'dataPolicy.config.deptIds'],
                ]],
            ],
        ];
    }

    public function apply(ModelBuilder|QueryBuilder $query, Actor $actor, DataPolicyRule $rule, DataPolicyTarget $target): void
    {
        if ($rule->scope === 'all') {
            return;
        }

        $deptColumn = $target->string('deptColumn', 'dept_id');
        $createdByColumn = $target->string('createdByColumn', 'created_by');
        $deptIds = $this->departmentIds($actor, $rule);

        if ($deptIds !== []) {
            if ($this->applyMembershipTarget($query, $target, $deptIds)) {
                return;
            }

            if ($deptColumn !== '') {
                $query->whereIn($deptColumn, $deptIds);
                return;
            }
        }

        if ($rule->scope === 'self' && $createdByColumn !== '') {
            $query->where($createdByColumn, (int) $actor->id);
            return;
        }

        $query->whereRaw('1 = 0');
    }

    public function contains(DataPolicyRule $parent, DataPolicyRule $child): bool
    {
        if ($parent->strategy !== $this->key() || $child->strategy !== $this->key()) {
            return false;
        }

        if ($parent->scope === 'all') {
            return true;
        }
        if ($child->scope === 'all') {
            return false;
        }
        if ($parent->scope === $child->scope) {
            return ! in_array($parent->scope, ['custom_departments', 'custom_departments_and_children'], true)
                || $this->containsDepartmentIds($this->configuredDepartmentIds($parent), $this->configuredDepartmentIds($child));
        }

        if ($parent->scope === 'custom_departments_and_children' && $child->scope === 'custom_departments') {
            return $this->containsDepartmentIds($this->configuredDepartmentIds($parent), $this->configuredDepartmentIds($child));
        }

        return $parent->scope === 'department_and_children' && $child->scope === 'department';
    }

    /**
     * @param list<int> $deptIds
     */
    private function applyMembershipTarget(ModelBuilder|QueryBuilder $query, DataPolicyTarget $target, array $deptIds): bool
    {
        $membershipTable = $target->string('membershipTable');
        $membershipOwnerColumn = $target->string('membershipOwnerColumn');
        $membershipDeptColumn = $target->string('membershipDeptColumn');
        $ownerColumn = $target->string('ownerColumn', 'id');

        if ($membershipTable === '' || $membershipOwnerColumn === '' || $membershipDeptColumn === '' || $ownerColumn === '') {
            return false;
        }

        $query->whereExists(static function (QueryBuilder $subQuery) use ($membershipTable, $membershipOwnerColumn, $membershipDeptColumn, $ownerColumn, $deptIds): void {
            $subQuery
                ->selectRaw('1')
                ->from($membershipTable)
                ->whereColumn($membershipOwnerColumn, $ownerColumn)
                ->whereIn($membershipDeptColumn, $deptIds);
        });

        return true;
    }

    /**
     * @return list<int>
     */
    private function departmentIds(Actor $actor, DataPolicyRule $rule): array
    {
        if ($rule->scope === 'self') {
            return [];
        }

        if ($rule->scope === 'custom_departments') {
            return $this->normalizeDeptIds($rule->config['deptIds'] ?? []);
        }

        if ($rule->scope === 'custom_departments_and_children') {
            return $this->scopeProvider->selfAndDescendantDepartmentIds($this->normalizeDeptIds($rule->config['deptIds'] ?? []));
        }

        $operationDeptId = $this->contextDepartmentId($rule) ?? $this->scopeProvider->operationDepartmentId($actor);
        if ($operationDeptId === null) {
            return [];
        }

        if ($rule->scope === 'department') {
            return [$operationDeptId];
        }

        if ($rule->scope === 'department_and_children') {
            return $this->scopeProvider->selfAndDescendantDepartmentIds($operationDeptId);
        }

        return [];
    }

    private function contextDepartmentId(DataPolicyRule $rule): ?int
    {
        $context = $rule->config['_context'] ?? null;
        if (! is_array($context)) {
            return null;
        }

        $deptId = (int) ($context['deptId'] ?? 0);

        return $deptId > 0 ? $deptId : null;
    }

    private function containsDepartmentIds(mixed $parentDeptIds, mixed $childDeptIds): bool
    {
        $parent = $this->normalizeDeptIds($parentDeptIds);
        $child = $this->normalizeDeptIds($childDeptIds);

        return $child !== [] && array_diff($child, $parent) === [];
    }

    /**
     * @return list<int>
     */
    private function configuredDepartmentIds(DataPolicyRule $rule): array
    {
        $deptIds = $this->normalizeDeptIds($rule->config['deptIds'] ?? []);
        if ($deptIds === []) {
            return [];
        }

        return $rule->scope === 'custom_departments_and_children'
            ? $this->scopeProvider->selfAndDescendantDepartmentIds($deptIds)
            : $deptIds;
    }

    /**
     * @return list<int>
     */
    private function normalizeDeptIds(mixed $value): array
    {
        return is_array($value)
            ? array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)))
            : [];
    }
}
