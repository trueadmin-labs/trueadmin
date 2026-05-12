<?php

declare(strict_types=1);

namespace App\Foundation\Http\Controller;

use TrueAdmin\Kernel\Metadata\OpenApiDocumentBuilder;

final class OpenApiController extends OpenController
{
    public function __construct(private readonly OpenApiDocumentBuilder $builder)
    {
    }

    public function document(): array
    {
        return $this->builder->build();
    }
}
