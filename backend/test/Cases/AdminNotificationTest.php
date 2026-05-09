<?php

declare(strict_types=1);

namespace HyperfTest\Cases;

use App\Module\System\Service\Notification\AdminAnnouncementService;
use App\Module\System\Service\Notification\AdminNotificationService;
use App\Module\System\Service\Notification\AdminNotificationTemplateRegistry;
use Hyperf\DbConnection\Db;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;
use Hyperf\Testing\TestCase;
use TrueAdmin\Kernel\Exception\BusinessException;

use function Hyperf\Support\make;

/**
 * @internal
 * @coversNothing
 */
class AdminNotificationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureNotificationTables();
        $this->ensureAdminUser();
    }

    public function testNotificationTemplateSendCreatesRenderedDelivery(): void
    {
        $adminId = $this->adminId();
        $templateKey = 'test.notification.' . str_replace('.', '', uniqid('', true));

        make(AdminNotificationTemplateRegistry::class)->register($templateKey, [
            'title' => '任务 {{name}}',
            'content' => '请处理 {{name}}，编号 {{code}}。',
        ]);

        $result = make(AdminNotificationService::class)->send([
            'receiverIds' => [$adminId],
            'type' => 'system',
            'level' => 'info',
            'source' => 'system',
            'templateKey' => $templateKey,
            'variables' => ['name' => '复核', 'code' => 'N-001'],
            'payload' => ['bizId' => 1],
        ]);

        $this->assertSame('completed', $result['status']);
        $this->assertSame('任务 复核', $result['title']);

        $delivery = Db::table('admin_notification_deliveries')
            ->where('batch_id', (int) $result['id'])
            ->first();

        $this->assertNotNull($delivery);
        $this->assertSame('任务 复核', $delivery->title);
        $this->assertSame('请处理 复核，编号 N-001。', $delivery->content);
    }

    public function testNotificationSendValidatesTargetAndAttachmentUrl(): void
    {
        $service = make(AdminNotificationService::class);

        try {
            $service->send([
                'title' => '缺少目标',
            ]);
            $this->fail('Expected validation exception for empty targets.');
        } catch (BusinessException $exception) {
            $this->assertSame('notification_target_required', $exception->params()['reason'] ?? null);
        }

        try {
            $service->send([
                'receiverIds' => [$this->adminId()],
                'title' => '不安全附件',
                'attachments' => [[
                    'id' => 'bad',
                    'name' => 'bad.pdf',
                    'url' => 'javascript:alert(1)',
                ]],
            ]);
            $this->fail('Expected validation exception for unsafe attachment URL.');
        } catch (BusinessException $exception) {
            $this->assertSame('attachment_url_invalid', $exception->params()['reason'] ?? null);
        }
    }

    public function testAnnouncementRestoreReactivatesOfflineAnnouncement(): void
    {
        $service = make(AdminAnnouncementService::class);
        $suffix = str_replace('.', '', uniqid('', true));

        $announcement = $service->create([
            'title' => '恢复公告' . $suffix,
            'content' => 'content',
            'level' => 'info',
            'type' => 'announcement',
            'source' => 'system',
            'targetType' => 'all',
            'targetRoleIds' => [],
            'targetUrl' => null,
            'payload' => [],
            'attachments' => [],
            'pinned' => false,
            'scheduledAt' => null,
            'expireAt' => null,
        ]);

        $offline = $service->offline((int) $announcement['id']);
        $this->assertSame('offline', $offline['status']);

        $restored = $service->restore((int) $announcement['id']);
        $this->assertSame('active', $restored['status']);
        $this->assertNotNull($restored['publishedAt']);
    }

    private function adminId(): int
    {
        return (int) Db::table('admin_users')->where('username', 'admin')->value('id');
    }

    private function ensureAdminUser(): void
    {
        if ((int) Db::table('admin_users')->where('username', 'admin')->count() > 0) {
            return;
        }

        $now = date('Y-m-d H:i:s');
        Db::table('admin_users')->insert([
            'username' => 'admin',
            'password' => 'test',
            'nickname' => '管理员',
            'status' => 'enabled',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function ensureNotificationTables(): void
    {
        if (! Schema::hasTable('admin_notification_batches')) {
            Schema::create('admin_notification_batches', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->string('type', 64)->default('system');
                $table->string('level', 32)->default('info');
                $table->string('source', 64)->default('system');
                $table->json('targets')->nullable();
                $table->string('template_key', 128)->nullable();
                $table->json('template_variables')->nullable();
                $table->string('fallback_title', 255)->nullable();
                $table->text('fallback_content')->nullable();
                $table->json('payload')->nullable();
                $table->json('attachments')->nullable();
                $table->string('target_url', 512)->nullable();
                $table->string('dedupe_key', 191)->nullable();
                $table->integer('dedupe_ttl_seconds')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('status', 32)->default('completed');
                $table->string('operator_type', 32)->default('admin');
                $table->unsignedBigInteger('operator_id')->nullable();
                $table->string('operator_name', 64)->default('');
                $table->unsignedBigInteger('impersonator_id')->nullable();
                $table->string('error_message', 512)->nullable();
                $table->datetimes();
            });
        }

        if (! Schema::hasTable('admin_notification_deliveries')) {
            Schema::create('admin_notification_deliveries', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('batch_id');
                $table->unsignedBigInteger('receiver_id');
                $table->string('receiver_name', 64)->default('');
                $table->string('locale', 32)->default('zh_CN');
                $table->string('title', 255);
                $table->text('content')->nullable();
                $table->json('payload')->nullable();
                $table->json('attachments')->nullable();
                $table->string('target_url', 512)->nullable();
                $table->string('status', 32)->default('pending');
                $table->string('skip_reason', 64)->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamp('archived_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('error_message', 512)->nullable();
                $table->integer('retry_count')->default(0);
                $table->datetimes();
            });
        }

        if (! Schema::hasTable('admin_announcements')) {
            Schema::create('admin_announcements', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->string('title', 255);
                $table->text('content')->nullable();
                $table->string('level', 32)->default('info');
                $table->string('type', 64)->default('announcement');
                $table->string('source', 64)->default('system');
                $table->string('scope', 32)->default('all');
                $table->json('role_ids')->nullable();
                $table->json('payload')->nullable();
                $table->json('attachments')->nullable();
                $table->string('target_url', 512)->nullable();
                $table->string('status', 32)->default('draft');
                $table->boolean('pinned')->default(false);
                $table->timestamp('publish_at')->nullable();
                $table->timestamp('expire_at')->nullable();
                $table->string('operator_type', 32)->default('admin');
                $table->unsignedBigInteger('operator_id')->nullable();
                $table->string('operator_name', 64)->default('');
                $table->datetimes();
            });
        }

        if (! Schema::hasTable('admin_announcement_reads')) {
            Schema::create('admin_announcement_reads', function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('announcement_id');
                $table->unsignedBigInteger('admin_id');
                $table->timestamp('read_at')->nullable();
                $table->timestamp('archived_at')->nullable();
                $table->datetimes();
            });
        }
    }
}
