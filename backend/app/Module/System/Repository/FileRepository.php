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

namespace App\Module\System\Repository;

use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\File;
use Hyperf\Database\Model\Builder;
use TrueAdmin\Kernel\Context\Actor;

final class FileRepository extends AbstractRepository
{
    protected ?string $modelClass = File::class;

    protected array $keywordFields = ['name', 'path', 'url'];

    protected array $filterable = [
        'scope' => true,
        'owner_type' => true,
        'owner_id' => true,
        'owner_dept_id' => true,
        'category' => true,
        'disk' => true,
        'visibility' => true,
        'status' => true,
    ];

    protected array $sortable = ['id', 'size', 'created_at'];

    protected array $defaultSort = ['id' => 'desc'];

    public function paginate(CrudQuery $adminQuery, Actor $actor, callable $mapper): PageResult
    {
        $query = $this->query();
        $this->applyDataScope($query, $actor);

        return $this->pageQuery($query, $adminQuery, $mapper);
    }

    public function create(array $data): File
    {
        $file = $this->createModel($data);
        assert($file instanceof File);

        return $file;
    }

    public function update(File $file, array $data): File
    {
        $updated = $this->updateModel($file, $data);
        assert($updated instanceof File);

        return $updated;
    }

    public function find(int $id): ?File
    {
        $file = $this->findModelById($id);
        assert($file === null || $file instanceof File);

        return $file;
    }

    private function applyDataScope(Builder $query, Actor $actor): void
    {
        if ($actor->type !== 'admin') {
            $query->where('scope', $actor->type)->where('owner_id', (string) $actor->id);
            return;
        }

        $permissions = $actor->claims['permissions'] ?? [];
        $canViewAll = is_array($permissions) && (in_array('*', $permissions, true) || in_array('system:file:all', $permissions, true));
        if ($canViewAll) {
            return;
        }

        $query->where('scope', 'admin')->where('owner_id', (string) $actor->id);
    }
}
