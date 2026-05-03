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
        $login = $this->json('/api/v1/admin/auth/login', [
            'username' => 'admin',
            'password' => 'trueadmin',
        ]);

        $this->assertSame(0, $login['code']);
        $this->assertSame('Bearer', $login['data']['tokenType']);
        $this->assertNotEmpty($login['data']['accessToken']);

        $me = $this->get('/api/v1/admin/auth/me', [], [
            'Authorization' => 'Bearer ' . $login['data']['accessToken'],
        ]);

        $this->assertSame(0, $me['code']);
        $this->assertSame('admin', $me['data']['username']);
    }
}
