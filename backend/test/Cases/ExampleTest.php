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

        $this->assertSame(0, $response['code']);
        $this->assertSame('TrueAdmin Backend', $response['data']['name']);
    }

    public function testAdminAuthFlow()
    {
        $login = $this->loginAsAdmin();

        $me = $this->get('/api/v1/admin/auth/me', [], [
            'Authorization' => 'Bearer ' . $login['data']['accessToken'],
        ]);

        $this->assertSame(0, $me['code']);
        $this->assertSame('admin', $me['data']['username']);
    }

    public function testClientProfileExample()
    {
        $profile = $this->get('/api/v1/client/profile', [], [
            'X-Client-User-Id' => '10002',
            'X-Client-User-Name' => 'Second Client',
        ]);

        $this->assertSame(0, $profile['code']);
        $this->assertSame(10002, $profile['data']['id']);
        $this->assertSame('Second Client', $profile['data']['nickname']);
    }

    public function testProductModuleAdminAndClientEntrances()
    {
        $login = $this->loginAsAdmin();

        $adminProducts = $this->get('/api/v1/admin/products', [], [
            'Authorization' => 'Bearer ' . $login['data']['accessToken'],
        ]);

        $this->assertSame(0, $adminProducts['code']);
        $this->assertCount(2, $adminProducts['data']);
        $this->assertArrayHasKey('status', $adminProducts['data'][0]);
        $this->assertArrayHasKey('ownerUserId', $adminProducts['data'][0]);

        $clientProducts = $this->get('/api/v1/client/products');

        $this->assertSame(0, $clientProducts['code']);
        $this->assertCount(1, $clientProducts['data']);
        $this->assertArrayNotHasKey('status', $clientProducts['data'][0]);
        $this->assertSame('TrueAdmin Starter License', $clientProducts['data'][0]['name']);

        $ownerProducts = $this->get('/api/v1/client/products', [], [
            'X-Client-User-Id' => '10002',
            'X-Client-User-Name' => 'Second Client',
        ]);

        $this->assertSame(0, $ownerProducts['code']);
        $this->assertCount(2, $ownerProducts['data']);
        $this->assertSame('Draft Internal Product', $ownerProducts['data'][1]['name']);
    }

    private function loginAsAdmin()
    {
        $login = $this->json('/api/v1/admin/auth/login', [
            'username' => 'admin',
            'password' => 'trueadmin',
        ]);

        $this->assertSame(0, $login['code']);
        $this->assertSame('Bearer', $login['data']['tokenType']);
        $this->assertNotEmpty($login['data']['accessToken']);

        return $login;
    }
}
