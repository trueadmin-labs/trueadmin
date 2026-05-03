<?php

declare(strict_types=1);

namespace App\Controller\OpenApi;

use App\Controller\AbstractController;

final class OpenApiController extends AbstractController
{
    public function document(): array
    {
        return json_decode(
            file_get_contents(BASE_PATH . '/docs/openapi/openapi.json') ?: '{}',
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    }
}

