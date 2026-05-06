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
        $this->assertSame('admin', $me['data']['username']);
        $this->assertGreaterThanOrEqual(1, \Hyperf\DbConnection\Db::table('admin_login_logs')
            ->where('username', 'admin')
            ->where('status', 'success')
            ->count());
    }

    public function testAdminLoginFailureUsesStringErrorCode()
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => 'admin',
            'password' => 'wrong-password',
        ]);

        $this->assertSame('SYSTEM.AUTH.INVALID_CREDENTIALS', $login['code']);
        $this->assertSame('用户名或密码错误', $login['message']);
        $this->assertNull($login['data']);
        $this->assertGreaterThanOrEqual(1, \Hyperf\DbConnection\Db::table('admin_login_logs')
            ->where('username', 'admin')
            ->where('status', 'failed')
            ->where('reason', 'invalid_credentials')
            ->count());
    }

    public function testAdminLoginFailureUsesRequestLocale()
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => 'admin',
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
        $roleId = (int) \Hyperf\DbConnection\Db::table('admin_roles')->where('code', 'super-admin')->value('id');
        $menuIds = \Hyperf\DbConnection\Db::table('admin_menus')->pluck('id')->all();
        foreach ($menuIds as $menuId) {
            \Hyperf\DbConnection\Db::table('admin_role_menu')->updateOrInsert([
                'role_id' => $roleId,
                'menu_id' => (int) $menuId,
            ]);
        }

        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];

        $menus = $this->get('/api/admin/system/menu-tree', [], $headers);
        $this->assertSame('SUCCESS', $menus['code']);

        $permissions = $this->get('/api/admin/system/permissions', [], $headers);
        $this->assertSame('SUCCESS', $permissions['code']);
    }

    public function testSystemManagementCrudEntrances()
    {
        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];
        $suffix = str_replace('.', '', uniqid('', true));
        $operationLogStartId = (int) \Hyperf\DbConnection\Db::table('admin_operation_logs')->max('id');
        $adminPrimaryDeptId = (int) \Hyperf\DbConnection\Db::table('admin_users')
            ->where('username', 'admin')
            ->value('primary_dept_id');
        $superAdminRoleId = (int) \Hyperf\DbConnection\Db::table('admin_roles')->where('code', 'super-admin')->value('id');

        $deptA = $this->json('/api/admin/system/departments', [
            'code' => 'test-dept-a-' . $suffix,
            'name' => '测试部门A' . $suffix,
            'sort' => 10,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $deptA['code']);
        $this->assertSame(1, $deptA['data']['level']);

        $deptB = $this->json('/api/admin/system/departments', [
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

        $departments = $this->get('/api/admin/system/departments', ['keyword' => 'test-dept-a-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $departments['code']);
        $this->assertGreaterThanOrEqual(1, count($departments['data']));

        $deptAId = $deptA['data']['id'];
        $deptBId = $deptB['data']['id'];

        $menu = $this->json('/api/admin/system/menus', [
            'name' => '测试菜单' . $suffix,
            'path' => '/tests/' . $suffix,
            'permission' => 'test:' . $suffix . ':list',
            'type' => 'menu',
            'sort' => 99,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $menu['code']);
        $this->assertSame('测试菜单' . $suffix, $menu['data']['name']);

        $role = $this->json('/api/admin/system/roles', [
            'code' => 'test-role-' . $suffix,
            'name' => '测试角色' . $suffix,
            'parentId' => $superAdminRoleId,
            'sort' => 10,
            'status' => 'enabled',
            'menuIds' => [$menu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $role['code']);
        $this->assertSame($superAdminRoleId, $role['data']['parentId']);
        $this->assertSame(2, $role['data']['level']);
        $this->assertContains($menu['data']['id'], $role['data']['menuIds']);

        $menuOutsideParent = $this->json('/api/admin/system/menus', [
            'name' => '父角色外菜单' . $suffix,
            'path' => '/tests/outside-' . $suffix,
            'permission' => 'test:' . $suffix . ':outside',
            'type' => 'menu',
            'sort' => 101,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $menuOutsideParent['code']);

        $childRoleDenied = $this->json('/api/admin/system/roles', [
            'code' => 'test-child-role-denied-' . $suffix,
            'name' => '越权子角色' . $suffix,
            'parentId' => $role['data']['id'],
            'status' => 'enabled',
            'menuIds' => [$menuOutsideParent['data']['id']],
        ], $headers);
        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $childRoleDenied['code']);

        $childRole = $this->json('/api/admin/system/roles', [
            'code' => 'test-child-role-' . $suffix,
            'name' => '子角色' . $suffix,
            'parentId' => $role['data']['id'],
            'status' => 'enabled',
            'menuIds' => [$menu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $childRole['code']);
        $this->assertSame($role['data']['id'], $childRole['data']['parentId']);
        $this->assertSame(3, $childRole['data']['level']);
        $this->assertSame(rtrim((string) $role['data']['path'], ',') . ',' . $role['data']['id'] . ',', $childRole['data']['path']);

        $user = $this->json('/api/admin/system/users', [
            'username' => 'test-user-' . $suffix,
            'password' => 'trueadmin',
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

        $updatedMenu = $this->put('/api/admin/system/menus/' . $menu['data']['id'], [
            'name' => '测试菜单更新' . $suffix,
            'path' => '/tests/' . $suffix,
            'permission' => 'test:' . $suffix . ':list',
            'type' => 'menu',
            'sort' => 100,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $updatedMenu['code']);
        $this->assertSame('测试菜单更新' . $suffix, $updatedMenu['data']['name']);

        $updatedRole = $this->put('/api/admin/system/roles/' . $role['data']['id'], [
            'code' => 'test-role-' . $suffix,
            'name' => '测试角色更新' . $suffix,
            'status' => 'enabled',
            'menuIds' => [$menu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $updatedRole['code']);
        $this->assertSame('测试角色更新' . $suffix, $updatedRole['data']['name']);

        $updatedUser = $this->put('/api/admin/system/users/' . $user['data']['id'], [
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

        $users = $this->get('/api/admin/system/users', ['keyword' => 'test-user-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $users['code']);
        $this->assertGreaterThanOrEqual(1, $users['data']['total']);

        $clientUser = $this->json('/api/admin/system/client-users', [
            'username' => 'client-' . $suffix,
            'phone' => '138' . substr(str_pad((string) crc32($suffix), 8, '0', STR_PAD_LEFT), 0, 8),
            'email' => 'client-' . $suffix . '@example.test',
            'password' => 'trueadmin',
            'nickname' => '用户端账号' . $suffix,
            'status' => 'enabled',
            'registerChannel' => 'admin',
        ], $headers);
        $this->assertSame('SUCCESS', $clientUser['code']);
        $this->assertSame('client-' . $suffix, $clientUser['data']['username']);
        $this->assertSame('admin', $clientUser['data']['registerChannel']);

        $clientUsers = $this->get('/api/admin/system/client-users', ['keyword' => 'client-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $clientUsers['code']);
        $this->assertGreaterThanOrEqual(1, $clientUsers['data']['total']);

        $clientUserDetail = $this->get('/api/admin/system/client-users/' . $clientUser['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $clientUserDetail['code']);
        $this->assertSame($clientUser['data']['id'], $clientUserDetail['data']['id']);

        $disabledClientUser = $this->put('/api/admin/system/client-users/' . $clientUser['data']['id'] . '/disable', [], $headers);
        $this->assertSame('SUCCESS', $disabledClientUser['code']);
        $this->assertSame('disabled', $disabledClientUser['data']['status']);

        $enabledClientUser = $this->put('/api/admin/system/client-users/' . $clientUser['data']['id'] . '/enable', [], $headers);
        $this->assertSame('SUCCESS', $enabledClientUser['code']);
        $this->assertSame('enabled', $enabledClientUser['data']['status']);

        $updatedClientUser = $this->put('/api/admin/system/client-users/' . $clientUser['data']['id'], [
            'username' => 'client-' . $suffix,
            'phone' => $clientUser['data']['phone'],
            'email' => $clientUser['data']['email'],
            'nickname' => '用户端账号更新' . $suffix,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $updatedClientUser['code']);
        $this->assertSame('用户端账号更新' . $suffix, $updatedClientUser['data']['nickname']);

        $roleAuthorize = $this->json('/api/admin/system/roles/' . $role['data']['id'] . '/menus', [
            'menuIds' => [],
        ], $headers);
        $this->assertSame('SUCCESS', $roleAuthorize['code']);
        $this->assertSame([], $roleAuthorize['data']['menuIds']);

        $deleteClientUser = $this->delete('/api/admin/system/client-users/' . $clientUser['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteClientUser['code']);

        $deleteUser = $this->delete('/api/admin/system/users/' . $user['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteUser['code']);

        $deleteChildRole = $this->delete('/api/admin/system/roles/' . $childRole['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteChildRole['code']);

        $deleteRole = $this->delete('/api/admin/system/roles/' . $role['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteRole['code']);

        $deleteMenu = $this->delete('/api/admin/system/menus/' . $menu['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteMenu['code']);

        $deleteMenuOutsideParent = $this->delete('/api/admin/system/menus/' . $menuOutsideParent['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteMenuOutsideParent['code']);

        $deleteDeptB = $this->delete('/api/admin/system/departments/' . $deptBId, [], $headers);
        $this->assertSame('SUCCESS', $deleteDeptB['code']);

        $deleteDeptA = $this->delete('/api/admin/system/departments/' . $deptAId, [], $headers);
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

        $this->assertSame(6, $sync['menus']);
        $this->assertGreaterThanOrEqual(10, $sync['permissions']);

        $roleId = (int) \Hyperf\DbConnection\Db::table('admin_roles')->where('code', 'super-admin')->value('id');
        $menuIds = \Hyperf\DbConnection\Db::table('admin_menus')->pluck('id')->all();
        foreach ($menuIds as $menuId) {
            \Hyperf\DbConnection\Db::table('admin_role_menu')->updateOrInsert([
                'role_id' => $roleId,
                'menu_id' => (int) $menuId,
            ]);
        }

        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.departments')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.users')->count());
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.client-users')->count());
        $this->assertSame('system:user:create', \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('code', 'system:user:create')
            ->value('permission'));

        $openapi = $this->get('/api/v1/open/openapi.json');
        $this->assertSame('3.1.0', $openapi['openapi']);
        $this->assertArrayHasKey('/api/admin/system/users', $openapi['paths']);
        $this->assertArrayHasKey('/api/admin/system/client-users', $openapi['paths']);
        $this->assertSame('system:user:list', $openapi['paths']['/api/admin/system/users']['get']['x-trueadmin']['permission']);
        $this->assertSame('system:client-user:list', $openapi['paths']['/api/admin/system/client-users']['get']['x-trueadmin']['permission']);
        $this->assertSame('single', $openapi['paths']['/api/admin/system/users']['get']['x-trueadmin']['permissionMode']);
        $this->assertSame(['system:user:list'], $openapi['paths']['/api/admin/system/users']['get']['x-trueadmin']['permissions']);

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
        return $this->loginAs('admin');
    }

    private function loginAs(string $username)
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => $username,
            'password' => 'trueadmin',
        ]);

        $this->assertSame('SUCCESS', $login['code']);
        $this->assertSame('Bearer', $login['data']['tokenType']);
        $this->assertNotEmpty($login['data']['accessToken']);

        return $login;
    }

}
