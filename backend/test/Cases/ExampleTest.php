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

        $me = $this->get('/api/v1/admin/auth/me', [], [
            'Authorization' => 'Bearer ' . $login['data']['accessToken'],
        ]);

        $this->assertSame('SUCCESS', $me['code']);
        $this->assertSame('admin', $me['data']['username']);
    }

    public function testAdminLoginFailureUsesStringErrorCode()
    {
        $login = $this->json('/api/v1/admin/auth/login', [
            'username' => 'admin',
            'password' => 'wrong-password',
        ]);

        $this->assertSame('SYSTEM.AUTH.INVALID_CREDENTIALS', $login['code']);
        $this->assertSame('用户名或密码错误', $login['message']);
        $this->assertNull($login['data']);
    }

    public function testAdminLoginFailureUsesRequestLocale()
    {
        $login = $this->json('/api/v1/admin/auth/login', [
            'username' => 'admin',
            'password' => 'wrong-password',
        ], [
            'Accept-Language' => 'en-US,en;q=0.9',
        ]);

        $this->assertSame('SYSTEM.AUTH.INVALID_CREDENTIALS', $login['code']);
        $this->assertSame('Invalid username or password.', $login['message']);
        $this->assertNull($login['data']);
    }

    public function testClientProfileExample()
    {
        $profile = $this->get('/api/v1/client/profile', [], [
            'X-Client-User-Id' => '10002',
            'X-Client-User-Name' => 'Second Client',
        ]);

        $this->assertSame('SUCCESS', $profile['code']);
        $this->assertSame(10002, $profile['data']['id']);
        $this->assertSame('Second Client', $profile['data']['nickname']);
    }

    public function testProductModuleAdminAndClientEntrances()
    {
        $login = $this->loginAsAdmin();

        $adminProducts = $this->get('/api/v1/admin/products', [], [
            'Authorization' => 'Bearer ' . $login['data']['accessToken'],
        ]);

        $this->assertSame('SUCCESS', $adminProducts['code']);
        $this->assertCount(2, $adminProducts['data']);
        $this->assertArrayHasKey('status', $adminProducts['data'][0]);
        $this->assertArrayHasKey('ownerUserId', $adminProducts['data'][0]);

        $clientProducts = $this->get('/api/v1/client/products');

        $this->assertSame('SUCCESS', $clientProducts['code']);
        $this->assertCount(1, $clientProducts['data']);
        $this->assertArrayNotHasKey('status', $clientProducts['data'][0]);
        $this->assertSame('TrueAdmin Starter License', $clientProducts['data'][0]['name']);

        $ownerProducts = $this->get('/api/v1/client/products', [], [
            'X-Client-User-Id' => '10002',
            'X-Client-User-Name' => 'Second Client',
        ]);

        $this->assertSame('SUCCESS', $ownerProducts['code']);
        $this->assertCount(2, $ownerProducts['data']);
        $this->assertSame('Draft Internal Product', $ownerProducts['data'][1]['name']);
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

        $menus = $this->get('/api/v1/admin/system/menu-tree', [], $headers);
        $this->assertSame('SUCCESS', $menus['code']);

        $permissions = $this->get('/api/v1/admin/system/permissions', [], $headers);
        $this->assertSame('SUCCESS', $permissions['code']);
    }

    public function testSystemManagementCrudEntrances()
    {
        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];
        $suffix = str_replace('.', '', uniqid('', true));

        $menu = $this->json('/api/v1/admin/system/menus', [
            'name' => '测试菜单' . $suffix,
            'path' => '/tests/' . $suffix,
            'permission' => 'test:' . $suffix . ':list',
            'type' => 'menu',
            'sort' => 99,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $menu['code']);
        $this->assertSame('测试菜单' . $suffix, $menu['data']['name']);

        $role = $this->json('/api/v1/admin/system/roles', [
            'code' => 'test-role-' . $suffix,
            'name' => '测试角色' . $suffix,
            'status' => 'enabled',
            'menuIds' => [$menu['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $role['code']);
        $this->assertContains($menu['data']['id'], $role['data']['menuIds']);

        $user = $this->json('/api/v1/admin/system/users', [
            'username' => 'test-user-' . $suffix,
            'password' => 'trueadmin',
            'nickname' => '测试用户' . $suffix,
            'status' => 'enabled',
            'roleIds' => [$role['data']['id']],
        ], $headers);
        $this->assertSame('SUCCESS', $user['code']);
        $this->assertSame('test-user-' . $suffix, $user['data']['username']);
        $this->assertContains($role['data']['id'], $user['data']['roleIds']);

        $users = $this->get('/api/v1/admin/system/users', ['keyword' => 'test-user-' . $suffix], $headers);
        $this->assertSame('SUCCESS', $users['code']);
        $this->assertGreaterThanOrEqual(1, $users['data']['total']);

        $roleAuthorize = $this->json('/api/v1/admin/system/roles/' . $role['data']['id'] . '/menus', [
            'menuIds' => [],
        ], $headers);
        $this->assertSame('SUCCESS', $roleAuthorize['code']);
        $this->assertSame([], $roleAuthorize['data']['menuIds']);

        $deleteUser = $this->delete('/api/v1/admin/system/users/' . $user['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteUser['code']);

        $deleteRole = $this->delete('/api/v1/admin/system/roles/' . $role['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteRole['code']);

        $deleteMenu = $this->delete('/api/v1/admin/system/menus/' . $menu['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleteMenu['code']);
    }


    public function testMetadataSyncAndOpenApiDocument()
    {
        $sync = \Hyperf\Context\ApplicationContext::getContainer()
            ->get(\App\Foundation\Metadata\MetadataSynchronizer::class)
            ->sync();

        $this->assertSame(5, $sync['menus']);
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
        $this->assertSame(1, \Hyperf\DbConnection\Db::table('admin_menus')->where('code', 'system.users')->count());
        $this->assertSame('system:user:create', \Hyperf\DbConnection\Db::table('admin_menus')
            ->where('code', 'system:user:create')
            ->value('permission'));

        $openapi = $this->get('/api/v1/open/openapi.json');
        $this->assertSame('3.1.0', $openapi['openapi']);
        $this->assertArrayHasKey('/api/v1/admin/system/users', $openapi['paths']);
        $this->assertSame('system:user:list', $openapi['paths']['/api/v1/admin/system/users']['get']['x-trueadmin']['permission']);
    }


    private function loginAsAdmin()
    {
        $login = $this->json('/api/v1/admin/auth/login', [
            'username' => 'admin',
            'password' => 'trueadmin',
        ]);

        $this->assertSame('SUCCESS', $login['code']);
        $this->assertSame('Bearer', $login['data']['tokenType']);
        $this->assertNotEmpty($login['data']['accessToken']);

        return $login;
    }
}
