<?php

declare(strict_types=1);

namespace App\Foundation\Http\Controller;

final class OpenApiController extends OpenController
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
