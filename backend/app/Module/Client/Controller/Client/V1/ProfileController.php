<?php

declare(strict_types=1);

namespace App\Module\Client\Controller\Client\V1;

use App\Module\Client\Service\Client\ProfileService;
use TrueAdmin\Kernel\Http\Controller\AbstractController;
use TrueAdmin\Kernel\Support\ApiResponse;

final class ProfileController extends AbstractController
{
    public function __construct(private readonly ProfileService $profileService)
    {
    }

    public function show(): array
    {
        return ApiResponse::success($this->profileService->currentProfile());
    }
}
