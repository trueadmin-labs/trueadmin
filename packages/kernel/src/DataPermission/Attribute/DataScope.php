<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\DataPermission\Attribute;

use Attribute;
use Hyperf\Di\Annotation\AbstractAnnotation;
use TrueAdmin\Kernel\DataPermission\ScopeType;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class DataScope extends AbstractAnnotation
{
    public function __construct(
        public readonly string $deptColumn = 'dept_id',
        public readonly string $createdByColumn = 'created_by',
        public readonly ScopeType $scopeType = ScopeType::DEPARTMENT_CREATED_BY,
        public readonly ?array $onlyTables = null,
    ) {
    }
}
