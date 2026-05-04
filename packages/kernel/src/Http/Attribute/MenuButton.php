<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\Http\Attribute;

use Attribute;
use Hyperf\Di\Annotation\AbstractAnnotation;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class MenuButton extends AbstractAnnotation
{
    public function __construct(
        public readonly string $code,
        public readonly string $title,
        public readonly string $parent = '',
        public readonly string $permission = '',
        public readonly int $sort = 0,
    ) {
    }
}
