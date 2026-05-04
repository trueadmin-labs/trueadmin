<?php

declare(strict_types=1);

namespace App\Module\User\Http\Client\Controller\V1;

use App\Module\User\Service\ProfileService;
use App\Foundation\Http\Controller\ClientController;
use App\Foundation\Support\ApiResponse;

final class ProfileController extends ClientController
{
    public function __construct(private readonly ProfileService $profileService)
    {
    }

    public function show(): array
    {
        return ApiResponse::success($this->profileService->currentProfile());
    }
}
