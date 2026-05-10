<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use App\Foundation\Auth\ActorFactory;
use App\Foundation\DataPermission\DataPolicyStrategyInterface;
use App\Foundation\DataPermission\DataPolicyManager;
use App\Foundation\DataPermission\DataPolicyRegistry;
use App\Foundation\Query\AdminQuery;
use App\Module\System\Repository\AdminUserRepository;
use Hyperf\Context\ApplicationContext;
use Hyperf\DbConnection\Db;
use Hyperf\Testing\TestCase;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

/**
 * @internal
 * @coversNothing
 */
final class DataPolicyTest extends TestCase
{
    protected function tearDown(): void
    {
        ActorContext::clear();
        parent::tearDown();
    }

    public function testRegistryExposesResourceAndStrategyMetadata(): void
    {
        $metadata = $this->container()->get(DataPolicyRegistry::class)->metadata();

        $this->assertContains('admin_user', array_column($metadata['resources'], 'key'));
        $this->assertContains('organization', array_column($metadata['strategies'], 'key'));
        $this->assertSame('dataPolicy.resource.adminUser', $metadata['resources'][0]['i18n']);
    }

    public function testOrganizationScopesFilterAdminUsers(): void
    {
        $suffix = str_replace('.', '', uniqid('dp', true));
        $deptA = $this->createDepartment('dp-a-' . $suffix);
        $deptB = $this->createDepartment('dp-b-' . $suffix, $deptA);
        $deptC = $this->createDepartment('dp-c-' . $suffix);
        $actorId = 700000 + random_int(1, 9999);
        $userA = $this->createUser('dp-a-' . $suffix, $deptA, $actorId);
        $userB = $this->createUser('dp-b-' . $suffix, $deptB, 999001);
        $userC = $this->createUser('dp-c-' . $suffix, $deptC, 999002);

        $this->assertVisibleUserIds(['all' => []], $actorId, $deptA, $suffix, [$userA, $userB, $userC]);
        $this->assertVisibleUserIds(['self' => []], $actorId, $deptA, $suffix, [$userA]);
        $this->assertVisibleUserIds(['department' => []], $actorId, $deptA, $suffix, [$userA]);
        $this->assertVisibleUserIds(['department_and_children' => []], $actorId, $deptA, $suffix, [$userA, $userB]);
        $this->assertVisibleUserIds(['custom_departments' => ['deptIds' => [$deptC]]], $actorId, $deptA, $suffix, [$userC]);
    }

    public function testRegisteredResourceWithoutPolicyDenies(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-deny', true));
        $deptId = $this->createDepartment('dp-deny-' . $suffix);
        $userId = $this->createUser('dp-deny-' . $suffix, $deptId, 1);
        $roleId = $this->createRole('dp-deny-' . $suffix);

        ActorContext::set(ActorFactory::fromAdmin(801001, 'dp-deny', 'DP Deny', ['dp-deny'], [$roleId], [], $deptId, [$deptId]));

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage(ErrorCode::FORBIDDEN->message());

        $this->container()->get(AdminUserRepository::class)->findByIdForAction($userId, 'view');
    }

    public function testAssertDataPolicyAllowsPassesForAllowedTarget(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-allow', true));
        $deptId = $this->createDepartment('dp-allow-' . $suffix);
        $userId = $this->createUser('dp-allow-' . $suffix, $deptId, 1);
        $roleId = $this->createRole('dp-allow-' . $suffix);
        $this->createPolicy($roleId, 'view', 'department');

        ActorContext::set(ActorFactory::fromAdmin(801002, 'dp-allow', 'DP Allow', ['dp-allow'], [$roleId], [], $deptId, [$deptId]));

        $user = $this->container()->get(AdminUserRepository::class)->findByIdForAction($userId, 'view');

        $this->assertNotNull($user);
        $this->assertSame($userId, (int) $user->getAttribute('id'));
    }

    public function testUnregisteredResourceThrowsConfigurationError(): void
    {
        ActorContext::set(ActorFactory::fromAdmin(801003, 'dp-config', 'DP Config', [], [], [], null, []));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Data policy resource [missing_resource] is not registered.');

        $this->container()->get(DataPolicyManager::class)->apply(Db::table('admin_users'), 'missing_resource', 'list');
    }

    public function testOrganizationStrategyContainsScopeRules(): void
    {
        $strategy = $this->container()->get(DataPolicyRegistry::class)->strategy('organization');
        $this->assertInstanceOf(DataPolicyStrategyInterface::class, $strategy);

        $this->assertTrue($strategy->contains($this->rule('all'), $this->rule('department')));
        $this->assertTrue($strategy->contains($this->rule('department_and_children'), $this->rule('department')));
        $this->assertFalse($strategy->contains($this->rule('department'), $this->rule('self')));
        $this->assertTrue($strategy->contains(
            $this->rule('custom_departments', ['deptIds' => [1, 2, 3]]),
            $this->rule('custom_departments', ['deptIds' => [1, 3]]),
        ));
        $this->assertFalse($strategy->contains(
            $this->rule('custom_departments', ['deptIds' => [1, 2]]),
            $this->rule('custom_departments', ['deptIds' => [1, 3]]),
        ));
    }

    public function testAssertDataPolicyAllowsAllPassesAndDeniesBatchTargets(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-batch', true));
        $deptA = $this->createDepartment('dp-batch-a-' . $suffix);
        $deptB = $this->createDepartment('dp-batch-b-' . $suffix);
        $allowedUserId = $this->createUser('dp-batch-a-' . $suffix, $deptA, 1);
        $deniedUserId = $this->createUser('dp-batch-b-' . $suffix, $deptB, 1);
        $roleId = $this->createRole('dp-batch-' . $suffix);
        $this->createPolicy($roleId, 'delete', 'department');

        ActorContext::set(ActorFactory::fromAdmin(801004, 'dp-batch', 'DP Batch', ['dp-batch'], [$roleId], [], $deptA, [$deptA]));

        $repository = $this->container()->get(AdminUserRepository::class);
        $repository->assertIdsAllowedForAction([$allowedUserId], 'delete');

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage(ErrorCode::FORBIDDEN->message());

        $repository->assertIdsAllowedForAction([$allowedUserId, $deniedUserId], 'delete');
    }

    public function testRoleDataPoliciesAreIndependentFlatAssignments(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-flat', true));
        $narrowRoleId = $this->createRole('dp-flat-narrow-' . $suffix);
        $broadRoleId = $this->createRole('dp-flat-broad-' . $suffix);
        $this->createPolicy($narrowRoleId, 'list', 'self');
        $this->createPolicy($broadRoleId, 'list', 'all');

        $rules = Db::table('admin_role_data_policies')
            ->whereIn('role_id', [$narrowRoleId, $broadRoleId])
            ->orderBy('role_id')
            ->pluck('scope', 'role_id')
            ->all();

        $this->assertSame('self', $rules[$narrowRoleId] ?? null);
        $this->assertSame('all', $rules[$broadRoleId] ?? null);
    }

    /**
     * @param array<string, array<string, mixed>> $scopeConfig
     * @param list<int> $expectedIds
     */
    private function assertVisibleUserIds(array $scopeConfig, int $actorId, int $operationDeptId, string $suffix, array $expectedIds): void
    {
        $scope = array_key_first($scopeConfig);
        $config = $scopeConfig[$scope];
        $roleId = $this->createRole('dp-' . $scope . '-' . uniqid());
        $this->createPolicy($roleId, 'list', $scope, $config);
        ActorContext::set(ActorFactory::fromAdmin($actorId, 'dp-actor', 'DP Actor', ['dp-role'], [$roleId], [], $operationDeptId, [$operationDeptId]));

        $result = $this->container()->get(AdminUserRepository::class)->paginate(new AdminQuery(page: 1, pageSize: 50, keyword: $suffix));
        $ids = array_column($result->items, 'id');

        foreach ($expectedIds as $expectedId) {
            $this->assertContains($expectedId, $ids, sprintf('Scope [%s] should include user [%d].', $scope, $expectedId));
        }
    }

    private function createDepartment(string $code, int $parentId = 0): int
    {
        $now = date('Y-m-d H:i:s');
        $parent = $parentId > 0 ? Db::table('admin_departments')->where('id', $parentId)->first() : null;
        $id = (int) Db::table('admin_departments')->insertGetId([
            'parent_id' => $parentId,
            'code' => $code,
            'name' => $code,
            'level' => $parent === null ? 1 : ((int) $parent->level + 1),
            'path' => $parent === null ? '' : (rtrim((string) $parent->path, ',') . ',' . $parentId . ','),
            'sort' => 0,
            'status' => 'enabled',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $id;
    }

    private function createRole(string $code): int
    {
        $now = date('Y-m-d H:i:s');
        return (int) Db::table('admin_roles')->insertGetId([
            'code' => $code,
            'name' => $code,
            'sort' => 0,
            'status' => 'enabled',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function createUser(string $username, int $deptId, int $createdBy): int
    {
        $now = date('Y-m-d H:i:s');
        return (int) Db::table('admin_users')->insertGetId([
            'username' => $username,
            'password' => 'test',
            'nickname' => $username,
            'status' => 'enabled',
            'primary_dept_id' => $deptId,
            'created_by' => $createdBy,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * @param array<string, mixed> $config
     */
    private function createPolicy(int $roleId, string $action, string $scope, array $config = []): void
    {
        $now = date('Y-m-d H:i:s');
        Db::table('admin_role_data_policies')->insert([
            'role_id' => $roleId,
            'resource' => 'admin_user',
            'action' => $action,
            'strategy' => 'organization',
            'effect' => 'allow',
            'scope' => $scope,
            'config' => json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'status' => 'enabled',
            'sort' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function rule(string $scope, array $config = []): \TrueAdmin\Kernel\DataPermission\DataPolicyRule
    {
        return new \TrueAdmin\Kernel\DataPermission\DataPolicyRule('admin_user', 'list', 'organization', $scope, 'allow', $config);
    }

    private function container(): \Psr\Container\ContainerInterface
    {
        return ApplicationContext::getContainer();
    }
}
