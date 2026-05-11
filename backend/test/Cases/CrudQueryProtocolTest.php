<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use Hyperf\Testing\TestCase;

/**
 * @internal
 * @coversNothing
 */
final class CrudQueryProtocolTest extends TestCase
{
    public function testBracketFilterQueryProtocol(): void
    {
        $headers = $this->adminHeaders();
        $suffix = str_replace('.', '', uniqid('', true));
        $code = 'crud-query-' . $suffix;

        $created = $this->json('/api/admin/organization/roles', [
            'code' => $code,
            'name' => 'CRUD 查询协议 ' . $suffix,
            'sort' => 10,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $created['code']);

        $filtered = $this->get(
            '/api/admin/organization/roles?filter[code]=' . rawurlencode($code) . '&op[code]=%3D&page=1&pageSize=5&sort=id&order=desc',
            [],
            $headers,
        );

        $this->assertSame('SUCCESS', $filtered['code']);
        $this->assertSame(1, $filtered['data']['page']);
        $this->assertSame(5, $filtered['data']['pageSize']);
        $this->assertSame($code, $filtered['data']['items'][0]['code']);
        $this->assertContains((int) $created['data']['id'], array_column($filtered['data']['items'], 'id'));

        $deleted = $this->delete('/api/admin/organization/roles/' . $created['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleted['code']);
    }

    public function testJsonStringFilterCompatibility(): void
    {
        $headers = $this->adminHeaders();
        $suffix = str_replace('.', '', uniqid('', true));
        $code = 'crud-json-' . $suffix;

        $created = $this->json('/api/admin/organization/roles', [
            'code' => $code,
            'name' => 'CRUD JSON 兼容 ' . $suffix,
            'sort' => 10,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $created['code']);

        $filtered = $this->get('/api/admin/organization/roles', [
            'filter' => json_encode(['code' => $code], JSON_THROW_ON_ERROR),
            'op' => json_encode(['code' => '='], JSON_THROW_ON_ERROR),
        ], $headers);

        $this->assertSame('SUCCESS', $filtered['code']);
        $this->assertSame($code, $filtered['data']['items'][0]['code']);

        $deleted = $this->delete('/api/admin/organization/roles/' . $created['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleted['code']);
    }

    private function adminHeaders(): array
    {
        $login = $this->json('/api/admin/auth/login', [
            'username' => 'trueadmin',
            'password' => '123456',
        ]);

        $this->assertSame('SUCCESS', $login['code']);

        return ['Authorization' => 'Bearer ' . $login['data']['accessToken']];
    }
}
