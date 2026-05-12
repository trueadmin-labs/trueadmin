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
    public function testArrayFilterAndSortQueryProtocol(): void
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
            '/api/admin/organization/roles?filters[0][field]=code&filters[0][op]=eq&filters[0][value]=' . rawurlencode($code) . '&page=1&pageSize=5&sorts[0][field]=id&sorts[0][order]=desc',
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

    public function testPostStyleArrayQueryProtocol(): void
    {
        $headers = $this->adminHeaders();
        $suffix = str_replace('.', '', uniqid('', true));
        $code = 'crud-json-' . $suffix;

        $created = $this->json('/api/admin/organization/roles', [
            'code' => $code,
            'name' => 'CRUD 数组协议 ' . $suffix,
            'sort' => 10,
            'status' => 'enabled',
        ], $headers);
        $this->assertSame('SUCCESS', $created['code']);

        $filtered = $this->get('/api/admin/organization/roles', [
            'filters' => [
                ['field' => 'code', 'op' => 'eq', 'value' => $code],
            ],
            'sorts' => [
                ['field' => 'id', 'order' => 'desc'],
                ['field' => 'sort', 'order' => 'asc'],
            ],
        ], $headers);

        $this->assertSame('SUCCESS', $filtered['code']);
        $this->assertSame($code, $filtered['data']['items'][0]['code']);

        $deleted = $this->delete('/api/admin/organization/roles/' . $created['data']['id'], [], $headers);
        $this->assertSame('SUCCESS', $deleted['code']);
    }

    public function testRejectsLegacyAndUnknownCrudQueryParams(): void
    {
        $headers = $this->adminHeaders();

        $legacyFilter = $this->get(
            '/api/admin/organization/roles?filter[code]=admin&op[code]=eq',
            [],
            $headers,
        );
        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $legacyFilter['code']);

        $legacySort = $this->get('/api/admin/organization/roles?sort=id&order=desc', [], $headers);
        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $legacySort['code']);

        $flatBusinessParam = $this->get('/api/admin/organization/users', [
            'roleCodes' => ['super-admin'],
        ], $headers);
        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $flatBusinessParam['code']);
    }

    public function testRejectsInvalidCrudQueryOperator(): void
    {
        $headers = $this->adminHeaders();

        $invalid = $this->get('/api/admin/organization/roles', [
            'filters' => [
                ['field' => 'code', 'op' => '=', 'value' => 'admin'],
            ],
        ], $headers);

        $this->assertSame('KERNEL.REQUEST.VALIDATION_FAILED', $invalid['code']);
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
