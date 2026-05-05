<?php

declare(strict_types=1);

namespace App\Foundation\Database\Command;

use App\Foundation\Database\ModuleSeederRunner;
use Hyperf\Command\Command;
use Symfony\Component\Console\Input\InputOption;

final class TrueAdminInitCommand extends Command
{
    public function __construct(private readonly ModuleSeederRunner $seeders)
    {
        parent::__construct('trueadmin:init');
        $this->setDescription('Run TrueAdmin migrations and module seeders');
    }

    protected function configure(): void
    {
        parent::configure();
        $this->addOption('fresh', null, InputOption::VALUE_NONE, 'Drop all tables and re-run all migrations before seeding');
        $this->addOption('seed-only', null, InputOption::VALUE_NONE, 'Only run module seeders');
        $this->addOption('no-seed', null, InputOption::VALUE_NONE, 'Only run migrations without seeders');
    }

    public function handle(): int
    {
        $seedOnly = (bool) $this->input->getOption('seed-only');
        $noSeed = (bool) $this->input->getOption('no-seed');
        $fresh = (bool) $this->input->getOption('fresh');

        if ($seedOnly && $noSeed) {
            $this->error('Options --seed-only and --no-seed cannot be used together.');
            return self::INVALID;
        }

        if (! $seedOnly) {
            $command = $fresh ? 'migrate:fresh' : 'migrate';
            $this->line(sprintf('Running %s...', $command));
            $exitCode = $this->call($command, ['--force' => true]);
            if ($exitCode !== self::SUCCESS) {
                return $exitCode;
            }
        }

        if (! $noSeed) {
            $this->line('Running module seeders...');
            foreach ($this->seeders->run() as $class) {
                $this->line(' - ' . $class);
            }
        }

        $this->info('TrueAdmin initialization completed.');

        return self::SUCCESS;
    }
}
