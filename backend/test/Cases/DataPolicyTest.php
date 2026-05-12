<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use App\Foundation\Auth\ActorFactory;
use App\Foundation\DataPermission\DataPolicyStrategyInterface;
use App\Foundation\DataPermission\DataPolicyManager;
use App\Foundation\DataPermission\DataPolicyRegistry;
use TrueAdmin\Kernel\Plugin\PluginRepository;
use TrueAdmin\Kernel\Crud\CrudQuery;
use App\Module\System\Repository\Notification\AdminAnnouncementRepository;
use App\Module\System\Repository\Notification\AdminNotificationBatchRepository;
use App\Module\System\Repository\AdminUserRepository;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Context\ApplicationContext;
use Hyperf\DbConnection\Db;
use Hyperf\Testing\TestCase;
use HyperfTest\Support\TestingDataPolicyStrategy;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

/**
 * @internal
 * @coversNothing
 */
final class DataPolicyTest extends TestCase
{
    private string $resourceDir;

    private string $resourceFile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resourceDir = BASE_PATH . '/app/Module/ZzDataPolicyTest/resources';
        $this->resourceFile = $this->resourceDir . '/data_policies.php';
        $this->removeResourceFile();
    }

    protected function tearDown(): void
    {
        ActorContext::clear();
        $this->removeResourceFile();
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
        $this->assertVisibleUserIds(['custom_departments' => ['deptIds' => [$deptA]]], $actorId, $deptC, $suffix, [$userA]);
        $this->assertVisibleUserIds(['custom_departments_and_children' => ['deptIds' => [$deptA]]], $actorId, $deptC, $suffix, [$userA, $userB]);
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

        $this->container()->get(AdminUserRepository::class)->findByIdWithDataPolicy($userId);
    }

    public function testAssertDataPolicyAllowsPassesForAllowedTarget(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-allow', true));
        $deptId = $this->createDepartment('dp-allow-' . $suffix);
        $userId = $this->createUser('dp-allow-' . $suffix, $deptId, 1);
        $roleId = $this->createRole('dp-allow-' . $suffix);
        $this->createPolicy($roleId, 'department');

        ActorContext::set(ActorFactory::fromAdmin(801002, 'dp-allow', 'DP Allow', ['dp-allow'], [$roleId], [], $deptId, [$deptId]));

        $user = $this->container()->get(AdminUserRepository::class)->findByIdWithDataPolicy($userId);

        $this->assertNotNull($user);
        $this->assertSame($userId, (int) $user->getAttribute('id'));
    }

    public function testUnregisteredResourceThrowsConfigurationError(): void
    {
        ActorContext::set(ActorFactory::fromAdmin(801003, 'dp-config', 'DP Config', [], [], [], null, []));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Data policy resource [missing_resource] is not registered.');

        $this->container()->get(DataPolicyManager::class)->apply(Db::table('admin_users'), 'missing_resource');
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

        $suffix = str_replace('.', '', uniqid('dp-contains', true));
        $deptA = $this->createDepartment('dp-contains-a-' . $suffix);
        $deptB = $this->createDepartment('dp-contains-b-' . $suffix, $deptA);
        $this->assertTrue($strategy->contains(
            $this->rule('custom_departments_and_children', ['deptIds' => [$deptA]]),
            $this->rule('custom_departments', ['deptIds' => [$deptB]]),
        ));
        $this->assertFalse($strategy->contains(
            $this->rule('custom_departments', ['deptIds' => [$deptA]]),
            $this->rule('custom_departments', ['deptIds' => [$deptB]]),
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
        $this->createPolicy($roleId, 'department');

        ActorContext::set(ActorFactory::fromAdmin(801004, 'dp-batch', 'DP Batch', ['dp-batch'], [$roleId], [], $deptA, [$deptA]));

        $repository = $this->container()->get(AdminUserRepository::class);
        $repository->assertIdsAllowedByDataPolicy([$allowedUserId]);

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage(ErrorCode::FORBIDDEN->message());

        $repository->assertIdsAllowedByDataPolicy([$allowedUserId, $deniedUserId]);
    }

    public function testRoleDataPoliciesAreIndependentFlatAssignments(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-flat', true));
        $narrowRoleId = $this->createRole('dp-flat-narrow-' . $suffix);
        $broadRoleId = $this->createRole('dp-flat-broad-' . $suffix);
        $this->createPolicy($narrowRoleId, 'self');
        $this->createPolicy($broadRoleId, 'all');

        $rules = Db::table('admin_role_data_policies')
            ->whereIn('role_id', [$narrowRoleId, $broadRoleId])
            ->orderBy('role_id')
            ->pluck('scope', 'role_id')
            ->all();

        $this->assertSame('self', $rules[$narrowRoleId] ?? null);
        $this->assertSame('all', $rules[$broadRoleId] ?? null);
    }

    public function testAnnouncementManagementDataPolicyUsesOperatorDepartment(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-announcement', true));
        $deptA = $this->createDepartment('dp-announcement-a-' . $suffix);
        $deptB = $this->createDepartment('dp-announcement-b-' . $suffix);
        $roleId = $this->createRole('dp-announcement-' . $suffix);
        $this->createPolicy($roleId, 'department', [], 'admin_announcement');
        $visibleId = $this->createAnnouncement('dp-visible-' . $suffix, 900001, $deptA);
        $hiddenId = $this->createAnnouncement('dp-hidden-' . $suffix, 900002, $deptB);

        ActorContext::set(ActorFactory::fromAdmin(801005, 'dp-announcement', 'DP Announcement', ['dp-announcement'], [$roleId], [], $deptA, [$deptA]));

        $result = $this->container()->get(AdminAnnouncementRepository::class)->paginate(new CrudQuery(page: 1, pageSize: 50, keyword: $suffix));
        $ids = array_column($result->items, 'id');

        $this->assertContains($visibleId, $ids);
        $this->assertNotContains($hiddenId, $ids);
    }

    public function testNotificationManagementDataPolicyUsesOperatorIdentity(): void
    {
        $suffix = str_replace('.', '', uniqid('dp-notification', true));
        $deptId = $this->createDepartment('dp-notification-' . $suffix);
        $actorId = 801006;
        $roleId = $this->createRole('dp-notification-' . $suffix);
        $this->createPolicy($roleId, 'self', [], 'admin_notification_batch');
        $visibleId = $this->createNotificationBatch('dp-visible-' . $suffix, $actorId, $deptId);
        $hiddenId = $this->createNotificationBatch('dp-hidden-' . $suffix, 900003, $deptId);

        ActorContext::set(ActorFactory::fromAdmin($actorId, 'dp-notification', 'DP Notification', ['dp-notification'], [$roleId], [], $deptId, [$deptId]));

        $result = $this->container()->get(AdminNotificationBatchRepository::class)->paginate(new CrudQuery(page: 1, pageSize: 50, keyword: $suffix));
        $ids = array_column($result->items, 'id');

        $this->assertContains($visibleId, $ids);
        $this->assertNotContains($hiddenId, $ids);
    }

    public function testModuleDataPolicyResourceFileRegistersStrategiesAndResources(): void
    {
        $this->writeDataPolicies([
            'strategies' => [TestingDataPolicyStrategy::class],
            'resources' => [
                [
                    'key' => 'testing_order',
                    'label' => 'Testing Order',
                    'i18n' => 'testing.dataPolicy.resource.order',
                    'strategies' => ['testing_data_policy'],
                    'sort' => 9900,
                ],
            ],
        ]);

        $metadata = $this->newRegistry()->metadata();

        $this->assertContains('testing_data_policy', array_column($metadata['strategies'], 'key'));
        $this->assertContains('testing_order', array_column($metadata['resources'], 'key'));
    }

    public function testModuleDataPolicyResourceRejectsDuplicateResource(): void
    {
        $this->writeDataPolicies([
            'strategies' => [TestingDataPolicyStrategy::class],
            'resources' => [
                ['key' => 'testing_duplicate', 'strategies' => ['testing_data_policy']],
                ['key' => 'testing_duplicate', 'strategies' => ['testing_data_policy']],
            ],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Duplicate data policy resource [testing_duplicate].');

        $this->newRegistry()->resources();
    }

    public function testModuleDataPolicyResourceRejectsUnregisteredStrategy(): void
    {
        $this->writeDataPolicies([
            'strategies' => [],
            'resources' => [
                ['key' => 'testing_missing_strategy', 'strategies' => ['missing_strategy']],
            ],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('references unregistered strategy [missing_strategy]');

        $this->newRegistry()->resources();
    }

    public function testModuleDataPolicyResourceRejectsActionsSchema(): void
    {
        $this->writeDataPolicies([
            'strategies' => [TestingDataPolicyStrategy::class],
            'resources' => [
                ['key' => 'testing_actions', 'strategies' => ['testing_data_policy'], 'actions' => ['list']],
            ],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('must not define actions');

        $this->newRegistry()->resources();
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
        $this->createPolicy($roleId, $scope, $config);
        ActorContext::set(ActorFactory::fromAdmin($actorId, 'dp-actor', 'DP Actor', ['dp-role'], [$roleId], [], $operationDeptId, [$operationDeptId]));

        $result = $this->container()->get(AdminUserRepository::class)->paginate(new CrudQuery(page: 1, pageSize: 50, keyword: $suffix));
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
    private function createPolicy(int $roleId, string $scope, array $config = [], string $resource = 'admin_user'): void
    {
        $now = date('Y-m-d H:i:s');
        Db::table('admin_role_data_policies')->insert([
            'role_id' => $roleId,
            'resource' => $resource,
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

    private function createAnnouncement(string $title, int $operatorId, int $operatorDeptId): int
    {
        $now = date('Y-m-d H:i:s');

        return (int) Db::table('admin_announcements')->insertGetId([
            'title' => $title,
            'content' => 'data policy announcement',
            'level' => 'info',
            'type' => 'announcement',
            'source' => 'system',
            'scope' => 'all',
            'role_ids' => '[]',
            'payload' => '[]',
            'attachments' => '[]',
            'target_url' => '',
            'status' => 'active',
            'pinned' => false,
            'publish_at' => $now,
            'expire_at' => null,
            'operator_type' => 'admin',
            'operator_id' => $operatorId,
            'operator_dept_id' => $operatorDeptId,
            'operator_name' => 'Data Policy Tester',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function createNotificationBatch(string $title, int $operatorId, int $operatorDeptId): int
    {
        $now = date('Y-m-d H:i:s');

        return (int) Db::table('admin_notification_batches')->insertGetId([
            'type' => 'system',
            'level' => 'info',
            'source' => 'system',
            'targets' => '[]',
            'template_key' => null,
            'template_variables' => '[]',
            'fallback_title' => $title,
            'fallback_content' => 'data policy notification',
            'payload' => '[]',
            'attachments' => '[]',
            'target_url' => '',
            'dedupe_key' => null,
            'dedupe_ttl_seconds' => null,
            'expires_at' => null,
            'status' => 'completed',
            'operator_type' => 'admin',
            'operator_id' => $operatorId,
            'operator_dept_id' => $operatorDeptId,
            'operator_name' => 'Data Policy Tester',
            'impersonator_id' => null,
            'error_message' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function rule(string $scope, array $config = []): \TrueAdmin\Kernel\DataPermission\DataPolicyRule
    {
        return new \TrueAdmin\Kernel\DataPermission\DataPolicyRule('admin_user', 'organization', $scope, 'allow', $config);
    }

    /**
     * @param array<string, mixed> $definition
     */
    private function writeDataPolicies(array $definition): void
    {
        if (! is_dir($this->resourceDir)) {
            mkdir($this->resourceDir, 0777, true);
        }

        file_put_contents($this->resourceFile, '<?php return ' . var_export($definition, true) . ';' . PHP_EOL);
    }

    private function removeResourceFile(): void
    {
        if (is_file($this->resourceFile)) {
            unlink($this->resourceFile);
        }
        if (is_dir($this->resourceDir)) {
            rmdir($this->resourceDir);
        }
        $moduleDir = dirname($this->resourceDir);
        if (is_dir($moduleDir)) {
            rmdir($moduleDir);
        }
    }

    private function newRegistry(): DataPolicyRegistry
    {
        $container = $this->container();

        return new DataPolicyRegistry(
            $container,
            $container->get(ConfigInterface::class),
            $container->get(PluginRepository::class),
        );
    }

    private function container(): \Psr\Container\ContainerInterface
    {
        return ApplicationContext::getContainer();
    }
}
