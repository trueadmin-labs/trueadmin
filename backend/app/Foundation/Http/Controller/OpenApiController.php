<?php

declare(strict_types=1);

namespace App\Foundation\Http\Controller;

use App\Foundation\Metadata\OpenApiDocumentBuilder;

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
