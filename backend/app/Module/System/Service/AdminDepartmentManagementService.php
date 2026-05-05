<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Query\AdminQuery;
use App\Module\System\Model\AdminDepartment;
use App\Module\System\Repository\AdminDepartmentRepository;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminDepartmentManagementService
{
    public function __construct(private readonly AdminDepartmentRepository $departments)
    {
    }

    public function tree(AdminQuery $query): array
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
        if ($this->departments->findByCode($code) !== null) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'code', 'reason' => 'duplicated']);
        }

        $parent = $this->parentDepartment((int) ($payload['parentId'] ?? $payload['parent_id'] ?? 0));
        $department = $this->departments->create([
            'parent_id' => $parent === null ? 0 : (int) $parent->getAttribute('id'),
            'code' => $code,
            'name' => (string) $payload['name'],
            'level' => $this->departmentLevel($parent),
            'path' => $this->departmentPath($parent),
            'sort' => (int) ($payload['sort'] ?? 0),
            'status' => (string) ($payload['status'] ?? 'enabled'),
        ]);

        return $this->detail((int) $department->getAttribute('id'));
    }

    public function update(int $id, array $payload): array
    {
        $department = $this->mustFind($id);
        $code = (string) $payload['code'];
        $exists = $this->departments->findByCode($code);
        if ($exists !== null && (int) $exists->getAttribute('id') !== $id) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'code', 'reason' => 'duplicated']);
        }

        $parentId = array_key_exists('parentId', $payload) || array_key_exists('parent_id', $payload)
            ? (int) ($payload['parentId'] ?? $payload['parent_id'])
            : (int) $department->getAttribute('parent_id');
        $parent = $this->parentDepartment($parentId, $id);

        $department = $this->departments->update($department, [
            'parent_id' => $parent === null ? 0 : (int) $parent->getAttribute('id'),
            'code' => $code,
            'name' => (string) $payload['name'],
            'level' => $this->departmentLevel($parent),
            'path' => $this->departmentPath($parent),
            'sort' => (int) ($payload['sort'] ?? $department->getAttribute('sort')),
            'status' => (string) ($payload['status'] ?? $department->getAttribute('status')),
        ]);

        return $this->detail((int) $department->getAttribute('id'));
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

        $this->departments->delete($department);
    }

    private function mustFind(int $id): AdminDepartment
    {
        $department = $this->departments->find($id);
        if ($department === null) {
            throw new BusinessException(ErrorCode::NOT_FOUND, 404, ['resource' => 'admin_department', 'id' => $id]);
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
            if ($parentId === $currentDepartmentId || $this->departments->isDescendant($parent, $currentDepartmentId)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'parentId', 'reason' => 'cannot_move_department_to_self_or_descendant']);
            }
        }

        return $parent;
    }

    private function departmentLevel(?AdminDepartment $parent): int
    {
        return $parent === null ? 1 : (int) $parent->getAttribute('level') + 1;
    }

    private function departmentPath(?AdminDepartment $parent): string
    {
        if ($parent === null) {
            return '';
        }

        return (string) $parent->getAttribute('path') . (int) $parent->getAttribute('id') . ',';
    }

}
