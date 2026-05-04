<?php

declare(strict_types=1);

namespace App\Foundation\Metadata\Command;

use App\Foundation\Metadata\InterfaceMetadataScanner;
use Hyperf\Command\Command;

final class TrueAdminMetadataCommand extends Command
{
    public function __construct(private readonly InterfaceMetadataScanner $scanner)
    {
        parent::__construct('trueadmin:metadata');
        $this->setDescription('Scan TrueAdmin interface metadata');
    }

    public function handle(): int
    {
        $this->line(json_encode($this->scanner->scan(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }
}
