<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use App\Foundation\Support\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Service\AdminUploadService;
use Hyperf\HttpMessage\Upload\UploadedFile;
use Hyperf\HttpServer\Contract\RequestInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\MenuButton;
use TrueAdmin\Kernel\Http\Attribute\Permission;

#[AdminRouteController(path: '/api/admin/system/uploads', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminUploadController extends AdminController
{
    public function __construct(private readonly AdminUploadService $uploads)
    {
    }

    #[AdminPost('image')]
    #[Permission(anyOf: ['system:menu:create', 'system:menu:update', 'system:upload:image'], title: '上传图片', group: '系统管理')]
    #[MenuButton(code: 'system:upload:image', title: '上传图片', parent: 'system.menus')]
    public function image(RequestInterface $request): array
    {
        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'required']);
        }

        return ApiResponse::success($this->uploads->image($file));
    }
}
