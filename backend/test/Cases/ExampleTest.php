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
        $login = $this->loginAsAdmin();
        $headers = ['Authorization' => 'Bearer ' . $login['data']['accessToken']];

        $menus = $this->get('/api/v1/admin/system/menus', [], $headers);
        $this->assertSame('SUCCESS', $menus['code']);

        $permissions = $this->get('/api/v1/admin/system/permissions', [], $headers);
        $this->assertSame('SUCCESS', $permissions['code']);
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
