<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\Http\Attribute;

use Attribute;
use Hyperf\Di\Annotation\AbstractAnnotation;

#[Attribute(Attribute::TARGET_CLASS)]
class Menu extends AbstractAnnotation
{
    public function __construct(
        public readonly string $code,
        public readonly string $title,
        public readonly string $path,
        public readonly string $parent = '',
        public readonly string $permission = '',
        public readonly string $icon = '',
        public readonly string $component = '',
        public readonly int $sort = 0,
        public readonly string $type = 'menu',
    ) {
    }
}
