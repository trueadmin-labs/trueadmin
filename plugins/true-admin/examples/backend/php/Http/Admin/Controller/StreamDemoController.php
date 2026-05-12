<?php

declare(strict_types=1);

namespace Plugin\TrueAdmin\Examples\Http\Admin\Controller;

use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use Plugin\TrueAdmin\Examples\Service\StreamDemoService;
use TrueAdmin\Kernel\Http\ApiResponse;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Streamable;
use TrueAdmin\Kernel\Http\Controller\AdminController;

#[AdminRouteController(path: '/api/admin/examples/stream-demo', middleware: [AdminAuthMiddleware::class])]
final class StreamDemoController extends AdminController
{
    public function __construct(private readonly StreamDemoService $demoService)
    {
    }

    #[AdminGet('progress')]
    #[Streamable(completedMessage: '流式演示完成')]
    public function progress(): array
    {
        return ApiResponse::success($this->demoService->runProgressDemo());
    }
}
