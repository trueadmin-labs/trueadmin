<?php

declare(strict_types=1);

namespace App\Module\System\Http\Admin\Controller;

use TrueAdmin\Kernel\Http\Controller\AdminController;
use TrueAdmin\Kernel\Http\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Http\Admin\Request\UpdateAdminPasswordRequest;
use App\Module\System\Http\Admin\Request\UpdateAdminProfileRequest;
use App\Module\System\Http\Admin\Request\UpdateAdminPreferencesRequest;
use App\Module\System\Service\AdminProfileService;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPut;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[AdminRouteController(path: '/api/admin/profile', middleware: [AdminAuthMiddleware::class])]
final class AdminProfileController extends AdminController
{
    public function __construct(private readonly AdminProfileService $profile)
    {
    }

    #[AdminGet('')]
    public function detail(): array
    {
        return ApiResponse::success($this->profile->detail(ActorContext::requirePrincipal()));
    }

    #[AdminPut('')]
    #[OperationLog(module: 'system', action: 'admin.profile.update', remark: '更新个人资料')]
    public function update(UpdateAdminProfileRequest $request): array
    {
        return ApiResponse::success($this->profile->update(
            ActorContext::requirePrincipal(),
            $request->validated(),
        ));
    }

    #[AdminPut('password')]
    #[OperationLog(module: 'system', action: 'admin.profile.password.update', remark: '修改个人密码')]
    public function updatePassword(UpdateAdminPasswordRequest $request): array
    {
        $this->profile->updatePassword(ActorContext::requirePrincipal(), $request->validated());

        return ApiResponse::success(null);
    }

    #[AdminPut('preferences')]
    #[OperationLog(module: 'system', action: 'admin.profile.preferences.update', remark: '更新个人偏好')]
    public function updatePreferences(UpdateAdminPreferencesRequest $request): array
    {
        return ApiResponse::success($this->profile->updatePreferences(
            ActorContext::requirePrincipal(),
            $request->validated(),
        ));
    }
}
