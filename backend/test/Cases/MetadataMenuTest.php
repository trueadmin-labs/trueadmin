<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use App\Foundation\Metadata\InterfaceMetadataScanner;
use App\Foundation\Metadata\MetadataSynchronizer;
use App\Module\System\Service\AdminMenuManagementService;
use Hyperf\Context\ApplicationContext;
use Hyperf\DbConnection\Db;
use Hyperf\Testing\TestCase;
use RuntimeException;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

/**
 * @internal
 * @coversNothing
 */
final class MetadataMenuTest extends TestCase
{
    private string $resourceDir;

    private string $resourceFile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resourceDir = BASE_PATH . '/app/Module/ZzMetadataTest/resources';
        $this->resourceFile = $this->resourceDir . '/menus.php';
        $this->removeResourceFile();
    }

    protected function tearDown(): void
    {
        $this->removeResourceFile();
        parent::tearDown();
    }

    public function testMenuResourceRejectsDuplicateCode(): void
    {
        $this->writeMenus([
            ['code' => 'zzMetadata.duplicate', 'title' => 'Duplicate A', 'path' => '/zz/a'],
            ['code' => 'zzMetadata.duplicate', 'title' => 'Duplicate B', 'path' => '/zz/b'],
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Duplicate menu code [zzMetadata.duplicate]');

        $this->scanner()->scan();
    }

    public function testMenuSyncRejectsMissingParent(): void
    {
        $this->writeMenus([
            ['code' => 'zzMetadata.child', 'title' => 'Child', 'path' => '/zz/child', 'parent' => 'zzMetadata.missing'],
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('references missing parent menu [zzMetadata.missing]');

        $this->sync()->sync(force: true);
    }

    public function testMenuSyncRejectsCircularParent(): void
    {
        $this->writeMenus([
            ['code' => 'zzMetadata.a', 'title' => 'A', 'path' => '/zz/a', 'parent' => 'zzMetadata.b'],
            ['code' => 'zzMetadata.b', 'title' => 'B', 'path' => '/zz/b', 'parent' => 'zzMetadata.a'],
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Circular menu parent relationship detected');

        $this->sync()->sync(force: true);
    }

    public function testLinkMenuSchemaAndForceDelete(): void
    {
        $staleId = (int) Db::table('admin_menus')->insertGetId([
            'parent_id' => 0,
            'code' => 'zzMetadata.stale',
            'type' => 'menu',
            'name' => 'Stale',
            'path' => '/zz/stale',
            'url' => '',
            'open_mode' => '',
            'show_link_header' => false,
            'icon' => '',
            'permission' => 'zz:stale:list',
            'source' => 'code',
            'sort' => 0,
            'status' => 'enabled',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        Db::table('admin_role_menu')->insert(['role_id' => 1, 'menu_id' => $staleId]);

        $this->writeMenus([
            ['code' => 'zzMetadata.root', 'title' => 'Root', 'type' => 'directory', 'sort' => 1],
            [
                'code' => 'zzMetadata.docs',
                'title' => 'Docs',
                'type' => 'link',
                'parent' => 'zzMetadata.root',
                'url' => 'https://example.com/docs',
                'openMode' => 'iframe',
                'showLinkHeader' => true,
                'permission' => 'zz:docs:view',
                'sort' => 2,
            ],
        ]);

        $this->sync()->sync(force: true);

        $link = Db::table('admin_menus')->where('code', 'zzMetadata.docs')->first();
        $this->assertNotNull($link);
        $this->assertSame('link', $link->type);
        $this->assertSame('https://example.com/docs', $link->url);
        $this->assertSame('iframe', $link->open_mode);
        $this->assertSame(1, (int) $link->show_link_header);
        $this->assertSame('zz:docs:view', $link->permission);
        $this->assertSame(0, Db::table('admin_menus')->where('code', 'zzMetadata.stale')->count());
        $this->assertSame(0, Db::table('admin_role_menu')->where('menu_id', $staleId)->count());
    }

    public function testLinkMenuRejectsInvalidUrlAndOpenMode(): void
    {
        $this->writeMenus([
            ['code' => 'zzMetadata.badLink', 'title' => 'Bad Link', 'type' => 'link', 'url' => 'javascript:alert(1)', 'openMode' => 'iframe'],
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('has an invalid link url');

        $this->scanner()->scan();
    }

    public function testCustomMenuRejectsInvalidCodeAndPermission(): void
    {
        $service = $this->container()->get(AdminMenuManagementService::class);

        try {
            $service->create([
                'type' => 'directory',
                'name' => 'Invalid Code',
                'code' => 'bad code',
                'permission' => 'system:valid:list',
            ]);
            $this->fail('Invalid custom menu code should fail.');
        } catch (BusinessException $exception) {
            $this->assertSame(ErrorCode::VALIDATION_FAILED->code(), $exception->businessCode());
            $this->assertSame('code', $exception->params()['field'] ?? null);
            $this->assertSame('invalid_code', $exception->params()['reason'] ?? null);
        }

        try {
            $service->create([
                'type' => 'directory',
                'name' => 'Invalid Permission',
                'code' => 'zzMetadata.invalidPermission',
                'permission' => 'invalid',
            ]);
            $this->fail('Invalid custom menu permission should fail.');
        } catch (BusinessException $exception) {
            $this->assertSame(ErrorCode::VALIDATION_FAILED->code(), $exception->businessCode());
            $this->assertSame('permission', $exception->params()['field'] ?? null);
            $this->assertSame('invalid_permission', $exception->params()['reason'] ?? null);
        }
    }

    /**
     * @param list<array<string, mixed>> $menus
     */
    private function writeMenus(array $menus): void
    {
        if (! is_dir($this->resourceDir)) {
            mkdir($this->resourceDir, 0777, true);
        }

        file_put_contents($this->resourceFile, '<?php return ' . var_export($menus, true) . ';' . PHP_EOL);
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

    private function scanner(): InterfaceMetadataScanner
    {
        return $this->container()->get(InterfaceMetadataScanner::class);
    }

    private function sync(): MetadataSynchronizer
    {
        return $this->container()->get(MetadataSynchronizer::class);
    }

    private function container(): \Psr\Container\ContainerInterface
    {
        return ApplicationContext::getContainer();
    }
}
