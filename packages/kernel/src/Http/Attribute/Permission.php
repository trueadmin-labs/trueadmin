<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\Http\Attribute;

use Attribute;
use Hyperf\Di\Annotation\AbstractAnnotation;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Permission extends AbstractAnnotation
{
    public function __construct(
        public readonly string $code,
        public readonly string $title = '',
        public readonly string $group = '',
        public readonly bool $public = false,
    ) {
    }
}
