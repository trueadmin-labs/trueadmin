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

namespace HyperfTest\Cases;

use App\Module\System\Event\AdminUserCreated;
use App\Module\System\Event\AdminUserDeleted;
use App\Module\System\Event\AdminUserUpdated;
use Hyperf\Context\ApplicationContext;
use Psr\EventDispatcher\ListenerProviderInterface;
use Hyperf\Testing\TestCase;

/**
 * @internal
 * @coversNothing
 */
class ExampleTest extends TestCase
{
    public function testIndex()
    {
        $response = $this->get('/');

        $this->assertSame('SUCCESS', $response['code']);
        $this->assertSame('TrueAdmin Backend', $response['data']['name']);
    }

    public function testAdminAuthFlow()
    {
        $login = $this->loginAsAdmin();

        $me = $this->get('/api/admin/auth/me', [], [
            'Authorization' => 'Bearer ' . $login['data']['accessToken'],
        ]);

        $this->assertSame('SUCCESS', $me['code']);
        $this->assertSame('trueadmin', $me['data']['username']);
        $this->assertArrayHasKey('avatar', $me['data']);
        $this->assertArrayHasKey('preferences', $me['data']);
        $this->assertGreaterThanOrEqual(1, \Hyperf\DbConnection\Db::table('admin_login_logs')
            ->where('username', 'trueadmin')
            ->where('status', 'success')
            ->count());
    }

    public function testAdminProfileAndLogEntrances()
    {
        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];
        $suffix = str_replace('.', '', uniqid('', true));

        $profile = $this->get('/api/admin/profile', [], $headers);
        $this->assertSame('SUCCESS', $profile['code']);
        $this->assertSame('trueadmin', $profile['data']['username']);
        $this->assertArrayHasKey('avatar', $profile['data']);
        $this->assertArrayHasKey('preferences', $profile['data']);

        $updatedProfile = $this->put('/api/admin/profile', [
            'nickname' => 'TrueAdmin ' . $suffix,
            'avatar' => 'https://example.com/avatar/' . $suffix . '.png',
        ], $headers);
        $this->assertSame('SUCCESS', $updatedProfile['code']);
        $this->assertSame('TrueAdmin ' . $suffix, $updatedProfile['data']['nickname']);
        $this->assertSame('https://example.com/avatar/' . $suffix . '.png', $updatedProfile['data']['avatar']);

        $password = $this->put('/api/admin/profile/password', [
            'oldPassword' => '123456',
            'newPassword' => '123456',
        ], $headers);
        $this->assertSame('SUCCESS', $password['code']);

        $layoutPreference = $this->put('/api/admin/profile/preferences', [
            'namespace' => 'system.layout',
            'values' => [
                'layoutMode' => 'mixed',
                'showTabs' => true,
            ],
        ], $headers);
        $this->assertSame('SUCCESS', $layoutPreference['code']);
        $this->assertSame('mixed', $layoutPreference['data']['preferences']['system.layout']['layoutMode']);
        $this->assertTrue($layoutPreference['data']['preferences']['system.layout']['showTabs']);

        $erpPreference = $this->put('/api/admin/profile/preferences', [
            'namespace' => 'erp.sales',
            'values' => ['defaultCustomerView' => 'mine'],
        ], $headers);
        $this->assertSame('SUCCESS', $erpPreference['code']);
        $this->assertSame('mixed', $erpPreference['data']['preferences']['system.layout']['layoutMode']);
        $this->assertSame('mine', $erpPreference['data']['preferences']['erp.sales']['defaultCustomerView']);

        $invalidPreference = $this->put('/api/admin/profile/preferences', [
            'namespace' => 'Bad Namespace',
            'values' => [],
        ], $headers);
        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $invalidPreference['code']);

        $loginLogs = $this->get('/api/admin/system-config/login-logs', [], $headers);
        $this->assertSame('SUCCESS', $loginLogs['code']);
        $this->assertArrayHasKey('items', $loginLogs['data']);

        $operationLogs = $this->get('/api/admin/system-config/operation-logs', [], $headers);
        $this->assertSame('SUCCESS', $operationLogs['code']);
        $this->assertGreaterThanOrEqual(1, $operationLogs['data']['total']);
    }

    public function testAdminLoginFailureUsesStringErrorCode()
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => 'trueadmin',
            'password' => 'wrong-password',
        ]);

        $this->assertSame('SYSTEM.AUTH.INVALID_CREDENTIALS', $login['code']);
        $this->assertSame('用户名或密码错误', $login['message']);
        $this->assertNull($login['data']);
        $this->assertGreaterThanOrEqual(1, \Hyperf\DbConnection\Db::table('admin_login_logs')
            ->where('username', 'trueadmin')
            ->where('status', 'failed')
            ->where('reason', 'invalid_credentials')
            ->count());
    }

    public function testAdminLoginFailureUsesRequestLocale()
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => 'trueadmin',
            'password' => 'wrong-password',
        ], [
            'Accept-Language' => 'en-US,en;q=0.9',
        ]);

        $this->assertSame('SYSTEM.AUTH.INVALID_CREDENTIALS', $login['code']);
        $this->assertSame('Invalid username or password.', $login['message']);
        $this->assertNull($login['data']);
    }

    public function testSystemPermissionEntrances()
    {
        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];

        $menus = $this->get('/api/admin/system-config/menu-tree', [], $headers);
        $this->assertSame('SUCCESS', $menus['code']);

        $permissions = $this->get('/api/admin/system-config/permissions', [], $headers);
        $this->assertSame('SUCCESS', $permissions['code']);
    }

    public function testSystemManagementCrudEntrances()
    {
        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];
        $suffix = str_replace('.', '', uniqid('', true));
        $operationLogStartId = (int) \Hyperf\DbConnection\Db::table('admin_operation_logs')->max('id');
        $adminPrimaryDeptId = 1;
        $adminUserEvents = [];
        $listenerProvider = ApplicationContext::getContainer()->get(ListenerProviderInterface::class);
        $listenerProvider->on(AdminUserCreated::class, static function (AdminUserCreated $event) use (&$adminUserEvents): void {
            $adminUserEvents['created'][] = $event;
        });
        $listenerProvider->on(AdminUserUpdated::class, static function (AdminUserUpdated $event) use (&$adminUserEvents): void {
            $adminUserEvents['updated'][] = $event;
        });
        $listenerProvider->on(AdminUserDeleted::class, static function (AdminUserDeleted $event) use (&$adminUserEvents): void {
            $adminUserEvents['deleted'][] = $event;
        });

        $deptA = $this->json('/api/admin/organization/departments', [
            'code' => 'test-dept-a-' . $suffix,
            'name' => '测试部门A' . $suffix,
            'sort' => 10,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $deptA['code']);
        $this->assertSame(1, $deptA['data']['level']);

        $deptB = $this->json('/api/admin/organization/departments', [
            'code' => 'test-dept-b-' . $suffix,
            'name' => '测试部门B' . $suffix,
            'parentId' => $deptA['data']['id'],
            'sort' => 20,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $deptB['code']);
        $this->assertSame($deptA['data']['id'], $deptB['data']['parentId']);
        $this->assertSame(2, $deptB['data']['level']);
        $this->assertSame(',' . $deptA['data']['id'] . ',', $deptB['data']['path']);

        $departments = $this->get('/api/admin/organization/departments', ['keyword' => 'test-dept-a-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $departments['code']);
        $this->assertGreaterThanOrEqual(1, count($departments['data']));

        $deptAId = $deptA['data']['id'];
        $deptBId = $deptB['data']['id'];

        $menu = $this->json('/api/admin/system-config/menus', [
            'name' => '测试链接' . $suffix,
            'permission' => 'test:' . $suffix . ':link',
            'type' => 'link',
            'url' => 'https://example.com/tests/' . $suffix,
            'openMode' => 'iframe',
            'sort' => 99,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $menu['code']);
        $this->assertSame('测试链接' . $suffix, $menu['data']['name']);
        $this->assertSame('link', $menu['data']['type']);
        $this->assertSame('custom', $menu['data']['source']);
        $this->assertSame('iframe', $menu['data']['openMode']);

        $role = $this->json('/api/admin/organization/roles', [
            'code' => 'test-role-' . $suffix,
            'name' => '测试角色' . $suffix,
            'sort' => 10,
            'status' => 'enabled',
            'menuIds' => [$menu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $role['code']);
        $this->assertArrayNotHasKey('parentId', $role['data']);
        $this->assertArrayNotHasKey('level', $role['data']);
        $this->assertArrayNotHasKey('path', $role['data']);
        $this->assertContains($menu['data']['id'], $role['data']['menuIds']);

        $secondMenu = $this->json('/api/admin/system-config/menus', [
            'name' => '独立角色链接' . $suffix,
            'permission' => 'test:' . $suffix . ':outside',
            'type' => 'link',
            'url' => 'https://example.com/tests/outside-' . $suffix,
            'openMode' => 'blank',
            'sort' => 101,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $secondMenu['code']);

        $secondRole = $this->json('/api/admin/organization/roles', [
            'code' => 'test-second-role-' . $suffix,
            'name' => '独立角色' . $suffix,
            'sort' => 11,
            'status' => 'enabled',
            'menuIds' => [$secondMenu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $secondRole['code']);
        $this->assertContains($secondMenu['data']['id'], $secondRole['data']['menuIds']);

        $roleOptions = $this->get('/api/admin/organization/roles/options', [], $headers);
        $this->assertSame('SUCCESS', $roleOptions['code']);
        $roleOptionIds = array_column($roleOptions['data'], 'id');
        $this->assertContains($role['data']['id'], $roleOptionIds);
        $this->assertContains($secondRole['data']['id'], $roleOptionIds);
        $this->assertArrayNotHasKey('children', $roleOptions['data'][0]);
        $this->assertArrayNotHasKey('parentId', $roleOptions['data'][0]);
        $this->assertArrayNotHasKey('parent_id', $roleOptions['data'][0]);
        $this->assertArrayNotHasKey('level', $roleOptions['data'][0]);
        $this->assertArrayNotHasKey('path', $roleOptions['data'][0]);

        $user = $this->json('/api/admin/organization/users', [
            'username' => 'test-user-' . $suffix,
            'password' => '123456',
            'nickname' => '测试用户' . $suffix,
            'status' => 'enabled',
            'roleIds' => [$role['data']['id']],
            'deptIds' => [$deptAId, $deptBId],
            'primaryDeptId' => $deptBId,
        ], $headers);
        $this->assertSame('SUCCESS', $user['code']);
        $this->assertSame('test-user-' . $suffix, $user['data']['username']);
        $this->assertContains($role['data']['id'], $user['data']['roleIds']);
        $this->assertSame($deptBId, $user['data']['primaryDeptId']);
        $this->assertEqualsCanonicalizing([$deptAId, $deptBId], $user['data']['deptIds']);

        $updatedMenu = $this->put('/api/admin/system-config/menus/' . $menu['data']['id'], [
            'name' => '测试链接更新' . $suffix,
            'permission' => 'test:' . $suffix . ':list',
            'type' => 'link',
            'url' => 'https://example.com/tests/updated-' . $suffix,
            'openMode' => 'self',
            'sort' => 100,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $updatedMenu['code']);
        $this->assertSame('测试链接更新' . $suffix, $updatedMenu['data']['name']);
        $this->assertSame('self', $updatedMenu['data']['openMode']);

        $updatedRole = $this->put('/api/admin/organization/roles/' . $role['data']['id'], [
            'code' => 'test-role-' . $suffix,
            'name' => '测试角色更新' . $suffix,
            'status' => 'enabled',
            'menuIds' => [$menu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $updatedRole['code']);
        $this->assertSame('测试角色更新' . $suffix, $updatedRole['data']['name']);

        $updatedUser = $this->put('/api/admin/organization/users/' . $user['data']['id'], [
            'username' => 'test-user-' . $suffix,
            'nickname' => '测试用户更新' . $suffix,
            'status' => 'enabled',
            'roleIds' => [$role['data']['id']],
            'deptIds' => [$deptAId, $deptBId],
            'primaryDeptId' => $deptAId,
        ], $headers);
        $this->assertSame('SUCCESS', $updatedUser['code']);
        $this->assertSame('测试用户更新' . $suffix, $updatedUser['data']['nickname']);
        $this->assertSame($deptAId, $updatedUser['data']['primaryDeptId']);

        $users = $this->get('/api/admin/organization/users', ['keyword' => 'test-user-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $users['code']);
        $this->assertGreaterThanOrEqual(1, $users['data']['total']);

        $filteredUsers = $this->get('/api/admin/organization/users', [
            'filters' => [
                ['field' => 'created_at', 'op' => 'between', 'value' => ['2000-01-01', '2999-12-31']],
                ['field' => 'status', 'op' => 'eq', 'value' => 'enabled'],
            ],
            'page' => 1,
            'pageSize' => 5,
            'params' => [
                'roleCodes' => ['test-role-' . $suffix],
            ],
            'sorts' => [
                ['field' => 'id', 'order' => 'desc'],
            ],
        ], $headers);
        $this->assertSame('SUCCESS', $filteredUsers['code']);
        $this->assertContains($user['data']['id'], array_column($filteredUsers['data']['items'], 'id'));
        foreach ($filteredUsers['data']['items'] as $item) {
            $this->assertSame('enabled', $item['status']);
            $this->assertContains('test-role-' . $suffix, $item['roles']);
        }

        $departmentUsers = $this->get('/api/admin/organization/users', [
            'keyword' => 'test-user-' . $suffix,
            'params' => [
                'deptId' => $deptAId,
                'includeChildren' => '1',
            ],
        ], $headers);
        $this->assertSame('SUCCESS', $departmentUsers['code']);
        $this->assertContains($user['data']['id'], array_column($departmentUsers['data']['items'], 'id'));

        $clientUser = $this->json('/api/admin/organization/client-users', [
            'username' => 'client-' . $suffix,
            'phone' => '138' . substr(str_pad((string) crc32($suffix), 8, '0', STR_PAD_LEFT), 0, 8),
            'email' => 'client-' . $suffix . '@example.test',
            'password' => '123456',
            'nickname' => '用户端账号' . $suffix,
            'status' => 'enabled',
            'registerChannel' => 'admin',
        ], $headers);
        $this->assertSame('SUCCESS', $clientUser['code']);
        $this->assertSame('client-' . $suffix, $clientUser['data']['username']);
        $this->assertSame('admin', $clientUser['data']['registerChannel']);

        $clientUsers = $this->get('/api/admin/organization/client-users', ['keyword' => 'client-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $clientUsers['code']);
        $this->assertGreaterThanOrEqual(1, $clientUsers['data']['total']);

        $clientUserDetail = $this->get('/api/admin/organization/client-users/' . $clientUser['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $clientUserDetail['code']);
        $this->assertSame($clientUser['data']['id'], $clientUserDetail['data']['id']);

        $disabledClientUser = $this->put('/api/admin/organization/client-users/' . $clientUser['data']['id'] . '/disable', [], $headers);
        $this->assertSame('SUCCESS', $disabledClientUser['code']);
        $this->assertSame('disabled', $disabledClientUser['data']['status']);

        $enabledClientUser = $this->put('/api/admin/organization/client-users/' . $clientUser['data']['id'] . '/enable', [], $headers);
        $this->assertSame('SUCCESS', $enabledClientUser['code']);
        $this->assertSame('enabled', $enabledClientUser['data']['status']);

        $updatedClientUser = $this->put('/api/admin/organization/client-users/' . $clientUser['data']['id'], [
            'username' => 'client-' . $suffix,
            'phone' => $clientUser['data']['phone'],
            'email' => $clientUser['data']['email'],
            'nickname' => '用户端账号更新' . $suffix,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $updatedClientUser['code']);
        $this->assertSame('用户端账号更新' . $suffix, $updatedClientUser['data']['nickname']);

        $roleAuthorize = $this->json('/api/admin/organization/roles/' . $role['data']['id'] . '/authorize', [
            'menuIds' => [],
        ], $headers);
        $this->assertSame('SUCCESS', $roleAuthorize['code']);
        $this->assertSame([], $roleAuthorize['data']['menuIds']);

        $deleteClientUser = $this->delete('/api/admin/organization/client-users/' . $clientUser['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteClientUser['code']);

        $deleteUser = $this->delete('/api/admin/organization/users/' . $user['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteUser['code']);
        $this->assertNotNull(\Hyperf\DbConnection\Db::table('admin_users')->where('id', $user['data']['id'])->value('deleted_at'));

        $deletedUserList = $this->get('/api/admin/organization/users', ['keyword' => 'test-user-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $deletedUserList['code']);
        $this->assertSame(0, $deletedUserList['data']['total']);

        $duplicateDeletedUser = $this->json('/api/admin/organization/users', [
            'username' => 'test-user-' . $suffix,
            'password' => '123456',
            'nickname' => '重复成员' . $suffix,
            'status' => 'enabled',
            'roleIds' => [$role['data']['id']],
            'deptIds' => [$deptAId],
            'primaryDeptId' => $deptAId,
        ], $headers);
        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $duplicateDeletedUser['code']);
        $this->assertSame('username', $duplicateDeletedUser['data']['field'] ?? null);
        $this->assertSame('duplicated', $duplicateDeletedUser['data']['reason'] ?? null);

        $this->assertSame($user['data']['id'], $adminUserEvents['created'][0]->userId ?? null);
        $this->assertSame($user['data']['id'], $adminUserEvents['updated'][0]->userId ?? null);
        $this->assertSame($user['data']['id'], $adminUserEvents['deleted'][0]->userId ?? null);
        $this->assertSame('test-user-' . $suffix, $adminUserEvents['deleted'][0]->user['username'] ?? null);
        $this->assertContains($role['data']['id'], $adminUserEvents['deleted'][0]->roleIds ?? []);
        $this->assertEqualsCanonicalizing([$deptAId, $deptBId], $adminUserEvents['deleted'][0]->departmentIds ?? []);
        $this->assertSame(0, \Hyperf\DbConnection\Db::table('admin_role_user')->where('user_id', $user['data']['id'])->count());
        $this->assertSame(0, \Hyperf\DbConnection\Db::table('admin_user_departments')->where('user_id', $user['data']['id'])->count());

        $deleteSecondRole = $this->delete('/api/admin/organization/roles/' . $secondRole['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteSecondRole['code']);

        $deleteRole = $this->delete('/api/admin/organization/roles/' . $role['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteRole['code']);

        $deleteMenu = $this->delete('/api/admin/system-config/menus/' . $menu['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteMenu['code']);

        $deleteSecondMenu = $this->delete('/api/admin/system-config/menus/' . $secondMenu['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteSecondMenu['code']);

        $deleteDeptB = $this->delete('/api/admin/organization/departments/' . $deptBId, [], $headers);
        $this->assertSame('SUCCESS', $deleteDeptB['code']);

        $deleteDeptA = $this->delete('/api/admin/organization/departments/' . $deptAId, [], $headers);
        $this->assertSame('SUCCESS', $deleteDeptA['code']);

        $expectedActions = [
            'admin.department.create',
            'admin.department.delete',
            'admin.menu.create',
            'admin.menu.update',
            'admin.menu.delete',
            'admin.role.create',
            'admin.role.update',
            'admin.role.authorize',
            'admin.role.delete',
            'admin.user.create',
            'admin.user.update',
            'admin.user.delete',
            'client.user.create',
            'client.user.update',
            'client.user.enable',
            'client.user.disable',
            'client.user.delete',
        ];
        $actions = \Hyperf\DbConnection\Db::table('admin_operation_logs')
            ->where('id', '>', $operationLogStartId)
            ->whereIn('action', $expectedActions)
            ->pluck('action')
            ->all();
        $this->assertEqualsCanonicalizing($expectedActions, array_values(array_unique($actions)));
        $this->assertSame(0, \Hyperf\DbConnection\Db::table('admin_operation_logs')
            ->where('id', '>', $operationLogStartId)
            ->whereIn('action', [
                'admin_menu_create',
                'admin_menu_update',
                'admin_menu_delete',
                'admin_department_create',
                'admin_department_delete',
                'admin_role_create',
                'admin_role_update',
                'admin_role_authorize',
                'admin_role_delete',
                'admin_user_create',
                'admin_user_update',
                'admin_user_delete',
                'client_user_create',
                'client_user_update',
                'client_user_enable',
                'client_user_disable',
                'client_user_delete',
            ])
            ->count());
        $this->assertGreaterThanOrEqual(1, \Hyperf\DbConnection\Db::table('admin_operation_logs')
            ->where('id', '>', $operationLogStartId)
            ->where('operation_dept_id', $adminPrimaryDeptId)
            ->count());
    }


    public function testMetadataSyncAndOpenApiDocument()
    {
        $sync = \Hyperf\Context\ApplicationContext::getContainer()
            ->get(\App\Foundation\Metadata\MetadataSynchronizer::class)
            ->sync();

        $this->assertGreaterThanOrEqual(9, $sync['menus']);
        $this->assertGreaterThanOrEqual(10, $sync['permissions']);

        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'organization')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'messageManagement')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'systemConfig')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.departments')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.users')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.clientUsers')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.messages')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.notificationManagement')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.announcementManagement')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.loginLogs')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.operationLogs')->count());
        $this->assertSame('system:login-log:list', \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('code', 'system.loginLogs')
            ->value('permission'));
        $this->assertSame('system:operation-log:list', \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('code', 'system.operationLogs')
            ->value('permission'));
        $this->assertSame('system:user:create', \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('code', 'system.users.create')
            ->value('permission'));

        $openapi = $this->get('/api/v1/open/openapi.json');
        $this->assertSame('3.1.0', $openapi['openapi']);
        $this->assertArrayHasKey('/api/admin/organization/users', $openapi['paths']);
        $this->assertArrayHasKey('/api/admin/organization/client-users', $openapi['paths']);
        $this->assertArrayHasKey('/api/admin/profile', $openapi['paths']);
        $this->assertArrayHasKey('/api/admin/system-config/login-logs', $openapi['paths']);
        $this->assertArrayHasKey('/api/admin/system-config/operation-logs', $openapi['paths']);
        foreach ($openapi['paths'] as $path => $operations) {
            foreach ($operations as $method => $operation) {
                $this->assertNotSame('', $operation['summary'], sprintf('OpenAPI summary is empty for %s %s.', $method, $path));
            }
        }
        $this->assertSame('system:user:list', $openapi['paths']['/api/admin/organization/users']['get']['x-trueadmin']['permission']);
        $this->assertSame('system:client-user:list', $openapi['paths']['/api/admin/organization/client-users']['get']['x-trueadmin']['permission']);
        $this->assertSame(
            'App\\Module\\System\\Http\\Admin\\Controller\\AdminProfileController@detail',
            $openapi['paths']['/api/admin/profile']['get']['summary']
        );
        $this->assertSame('system:login-log:list', $openapi['paths']['/api/admin/system-config/login-logs']['get']['x-trueadmin']['permission']);
        $this->assertSame('system:operation-log:list', $openapi['paths']['/api/admin/system-config/operation-logs']['get']['x-trueadmin']['permission']);
        $this->assertSame('single', $openapi['paths']['/api/admin/organization/users']['get']['x-trueadmin']['permissionMode']);
        $this->assertSame(['system:user:list'], $openapi['paths']['/api/admin/organization/users']['get']['x-trueadmin']['permissions']);

        $this->assertSame('anyOf', $openapi['paths']['/api/admin/testing/permission-rules/any']['get']['x-trueadmin']['permissionMode']);
        $this->assertSame([
            'testing:permission:any-a',
            'testing:permission:any-b',
        ], $openapi['paths']['/api/admin/testing/permission-rules/any']['get']['x-trueadmin']['permissions']);
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('permission', 'testing:permission:any-a')
            ->count());
        $this->assertSame(0, \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('permission', 'testing:permission:any-a OR testing:permission:any-b')
            ->count());
    }

    public function testPermissionRulesSupportAnyOfAndAllOf()
    {
        $anyA = $this->loginAs('permission-any-a');
        $anyAHeaders = ['Authorization' => 'Bearer ' . $anyA['data']['accessToken']];

        $any = $this->get('/api/admin/testing/permission-rules/any', [], $anyAHeaders);
        $this->assertSame('SUCCESS', $any['code']);
        $this->assertSame('anyOf', $any['data']['mode']);

        $allDenied = $this->get('/api/admin/testing/permission-rules/all', [], $anyAHeaders);
        $this->assertSame('KERNEL.PERMISSION.FORBIDDEN', $allDenied['code']);

        $allA = $this->loginAs('permission-all-a');
        $allADenied = $this->get('/api/admin/testing/permission-rules/all', [], [
            'Authorization' => 'Bearer ' . $allA['data']['accessToken'],
        ]);
        $this->assertSame('KERNEL.PERMISSION.FORBIDDEN', $allADenied['code']);

        $allAB = $this->loginAs('permission-all-ab');
        $all = $this->get('/api/admin/testing/permission-rules/all', [], [
            'Authorization' => 'Bearer ' . $allAB['data']['accessToken'],
        ]);
        $this->assertSame('SUCCESS', $all['code']);
        $this->assertSame('allOf', $all['data']['mode']);
    }

    private function loginAsAdmin()
    {
        return $this->loginAs('trueadmin');
    }

    private function loginAs(string $username)
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => $username,
            'password' => '123456',
        ]);

        $this->assertSame('SUCCESS', $login['code']);
        $this->assertSame('Bearer', $login['data']['tokenType']);
        $this->assertNotEmpty($login['data']['accessToken']);

        return $login;
    }

}
