<?php

declare(strict_types=1);

namespace TrueAdmin\Kernel\DataPermission\Aspects;

use Hyperf\Collection\Arr;
use Hyperf\Di\Annotation\Aspect;
use Hyperf\Di\Aop\AbstractAspect;
use Hyperf\Di\Aop\ProceedingJoinPoint;
use TrueAdmin\Kernel\DataPermission\Attribute\DataScope;
use TrueAdmin\Kernel\DataPermission\Context;

#[Aspect]
final class DataScopeAspect extends AbstractAspect
{
    public array $annotations = [
        DataScope::class,
    ];

    public function process(ProceedingJoinPoint $proceedingJoinPoint)
    {
        $attribute = Arr::get($proceedingJoinPoint->getAnnotationMetadata()->method, DataScope::class)
            ?? Arr::get($proceedingJoinPoint->getAnnotationMetadata()->class, DataScope::class);

        if (! $attribute instanceof DataScope) {
            return $proceedingJoinPoint->process();
        }

        return Context::runWith([
            'deptColumn' => $attribute->deptColumn,
            'createdByColumn' => $attribute->createdByColumn,
            'scopeType' => $attribute->scopeType->value,
            'onlyTables' => $attribute->onlyTables,
        ], static fn () => $proceedingJoinPoint->process());
    }
}
