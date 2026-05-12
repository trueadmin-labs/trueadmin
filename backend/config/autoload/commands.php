<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
return [
    TrueAdmin\Kernel\Database\Command\TrueAdminMigrationPathsCommand::class,
    TrueAdmin\Kernel\Http\Command\TrueAdminRoutesCommand::class,
    TrueAdmin\Kernel\Metadata\Command\TrueAdminMetadataCommand::class,
    TrueAdmin\Kernel\Metadata\Command\TrueAdminMetadataSyncCommand::class,
    TrueAdmin\Kernel\Metadata\Command\TrueAdminOpenApiCommand::class,
];
