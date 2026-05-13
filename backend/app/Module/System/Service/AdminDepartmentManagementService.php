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

namespace App\Module\System\Service;

use App\Module\System\Model\AdminDepartment;
use App\Module\System\Repository\AdminDepartmentRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Service\AbstractService;
use TrueAdmin\Kernel\Support\TreeHelper;

final class AdminDepartmentManagementService extends AbstractService
{
    public function __construct(
        private readonly AdminDepartmentRepository $departments,
        private readonly TreeHelper $tree,
    ) {
    }

    public function tree(CrudQuery $query): array
    {
        return $this->departments->tree($query);
    }

    public function detail(int $id): array
    {
        return $this->departments->toArray($this->mustFind($id));
    }

    public function create(array $payload): array
    {
        $code = (string) $payload['code'];
        $this->assertUnique($this->departments->findByCode($code) !== null, 'code');

        $parent = $this->parentDepartment((int) ($payload['parentId'] ?? 0));
        $department = $this->departments->create([
            'parent_id' => $parent === null ? 0 : (int) $parent->getAttribute('id'),
            'code' => $code,
            'name' => (string) $payload['name'],
            'level' => $this->tree->level($parent),
            'path' => $this->tree->path($parent),
            'sort' => (int) ($payload['sort'] ?? 0),
            'status' => (string) ($payload['status'] ?? 'enabled'),
        ]);

        return $this->detail((int) $department->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $department = $this->mustFind($id);
            $code = (string) $payload['code'];
            $exists = $this->departments->findByCode($code);
            $this->assertUnique($exists !== null && (int) $exists->getAttribute('id') !== $id, 'code');

            $oldPath = (string) $department->getAttribute('path');
            $oldLevel = (int) $department->getAttribute('level');
            $parentId = array_key_exists('parentId', $payload)
                ? (int) $payload['parentId']
                : (int) $department->getAttribute('parent_id');
            $parent = $this->parentDepartment($parentId, $id);
            $newPath = $this->tree->path($parent);
            $newLevel = $this->tree->level($parent);

            $department = $this->departments->update($department, [
                'parent_id' => $parent === null ? 0 : (int) $parent->getAttribute('id'),
                'code' => $code,
                'name' => (string) $payload['name'],
                'level' => $newLevel,
                'path' => $newPath,
                'sort' => (int) ($payload['sort'] ?? $department->getAttribute('sort')),
                'status' => (string) ($payload['status'] ?? $department->getAttribute('status')),
            ]);

            $this->departments->updateDescendantTreeState(
                $id,
                $this->subtreePath($oldPath, $id),
                $this->subtreePath($newPath, $id),
                $newLevel - $oldLevel,
            );

            return $this->detail((int) $department->getAttribute('id'));
        });
    }

    public function delete(int $id): void
    {
        $department = $this->mustFind($id);
        if ($this->departments->childCount($id) > 0) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_department_with_children']);
        }
        if ($this->departments->assignedUserCount($id) > 0 || $this->departments->primaryUserCount($id) > 0) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_department_with_users']);
        }
        if ($this->departments->positionCount($id) > 0) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'cannot_delete_department_with_positions']);
        }

        $this->departments->delete($department);
    }

    private function mustFind(int $id): AdminDepartment
    {
        $department = $this->departments->find($id);
        if ($department === null) {
            throw $this->notFound('admin_department', $id);
        }

        return $department;
    }

    private function parentDepartment(int $parentId, ?int $currentDepartmentId = null): ?AdminDepartment
    {
        if ($parentId <= 0) {
            return null;
        }

        $parent = $this->departments->find($parentId);
        if ($parent === null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'missing_parent_department']);
        }
        if ($currentDepartmentId !== null) {
            if ($parentId === $currentDepartmentId || $this->tree->isDescendant($parent, $currentDepartmentId)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'cannot_move_department_to_self_or_descendant']);
            }
        }

        return $parent;
    }

    private function subtreePath(string $path, int $id): string
    {
        return rtrim($path, ',') . ',' . $id . ',';
    }
}
