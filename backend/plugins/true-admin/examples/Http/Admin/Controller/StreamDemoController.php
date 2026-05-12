<?php

declare(strict_types=1);

namespace Plugin\TrueAdmin\Examples\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use TrueAdmin\Kernel\Http\ApiResponse;
use Plugin\TrueAdmin\Examples\Service\StreamDemoService;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\Http\Attribute\Streamable;

#[AdminRouteController(path: '/api/admin/examples/stream-demo')]
final class StreamDemoController extends AdminController
{
    public function __construct(private readonly StreamDemoService $demoService)
    {
    }

    #[AdminGet('progress')]
    #[Permission(public: true)]
    #[Streamable(completedMessage: '流式演示完成')]
    public function progress(): array
    {
        return ApiResponse::success($this->demoService->runProgressDemo());
    }
}
