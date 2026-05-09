<?php

declare(strict_types=1);

namespace Plugin\TrueAdmin\Examples\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Support\ApiResponse;
use App\Module\System\Service\Notification\AdminNotificationService;
use App\Module\System\Service\Notification\AdminNotificationTemplateRegistry;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[AdminRouteController(path: '/api/admin/examples/notification-demo')]
final class NotificationDemoController extends AdminController
{
    public function __construct(
        private readonly AdminNotificationService $notifications,
        private readonly AdminNotificationTemplateRegistry $templates,
    ) {
    }

    #[AdminPost('direct')]
    #[Permission(public: true)]
    public function direct(): array
    {
        return ApiResponse::success($this->notifications->send([
            'receiverIds' => [1],
            'type' => 'example_task',
            'level' => 'info',
            'source' => 'true-admin.examples',
            'title' => '开发示例通知',
            'content' => '这是一条由示例插件发送的站内通知。',
            'payload' => [
                'orderNo' => 'EX-20260509-001',
                'customer' => '示例客户',
                'amount' => 12800,
                'status' => 'pending',
            ],
            'targetUrl' => '/examples/notification',
            'attachments' => [[
                'id' => 'demo-contract',
                'name' => '示例合同.pdf',
                'url' => '/mock/attachments/sales-contract.pdf',
                'extension' => 'pdf',
                'mimeType' => 'application/pdf',
            ]],
        ]));
    }

    #[AdminPost('template')]
    #[Permission(public: true)]
    public function template(): array
    {
        $this->templates->register('examples.task.assigned', [
            'title' => '待处理任务：{{taskName}}',
            'content' => '任务 **{{taskName}}** 已分配给你，请在 {{deadline}} 前处理。',
        ]);

        return ApiResponse::success($this->notifications->send([
            'receiverIds' => [1],
            'type' => 'example_task',
            'level' => 'warning',
            'source' => 'true-admin.examples',
            'templateKey' => 'examples.task.assigned',
            'variables' => [
                'taskName' => '合同复核',
                'deadline' => date('Y-m-d H:i', time() + 3600),
            ],
            'payload' => [
                'taskId' => 10001,
                'taskName' => '合同复核',
                'priority' => 'high',
            ],
            'targetUrl' => '/system/messages',
        ]));
    }
}
