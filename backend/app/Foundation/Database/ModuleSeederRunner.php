<?php

declare(strict_types=1);

namespace App\Foundation\Database;

use Hyperf\Database\Seeders\Seeder;
use RuntimeException;
use Throwable;

use function Hyperf\Support\make;

final class ModuleSeederRunner
{
    public function __construct(private readonly ModuleMigrationLocator $locator)
    {
    }

    /**
     * @return list<class-string<Seeder>>
     */
    public function seederClasses(): array
    {
        $classes = [];

        foreach ($this->locator->seederPaths() as $path) {
            foreach (glob($path . '/*.php') ?: [] as $file) {
                $class = $this->classFromFile($file);
                if ($class === null) {
                    continue;
                }

                if (! is_subclass_of($class, Seeder::class)) {
                    throw new RuntimeException(sprintf('Seeder must extend %s: %s', Seeder::class, $class));
                }

                $classes[] = $class;
            }
        }

        sort($classes);

        return array_values(array_unique($classes));
    }

    /**
     * @return list<class-string<Seeder>>
     */
    public function run(): array
    {
        $classes = $this->seederClasses();

        foreach ($classes as $class) {
            try {
                make($class)->run();
            } catch (Throwable $throwable) {
                throw new RuntimeException(sprintf('Failed to run seeder: %s', $class), 0, $throwable);
            }
        }

        return $classes;
    }

    /**
     * @return class-string<Seeder>|null
     */
    private function classFromFile(string $file): ?string
    {
        $contents = file_get_contents($file);
        if (! is_string($contents) || $contents === '') {
            return null;
        }

        $namespace = '';
        if (preg_match('/^namespace\s+([^;]+);/m', $contents, $matches) === 1) {
            $namespace = trim($matches[1]);
        }

        if (preg_match('/^\s*(?:final\s+)?class\s+(\w+)/m', $contents, $matches) !== 1) {
            return null;
        }

        $class = $namespace === '' ? $matches[1] : $namespace . '\\' . $matches[1];

        if (! class_exists($class)) {
            require_once $file;
        }

        return class_exists($class) ? $class : null;
    }
}
