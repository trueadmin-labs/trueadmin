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

namespace App\Module\System\Http\Admin\Controller;

use App\Foundation\Http\Controller\AdminController;
use App\Foundation\Http\Middleware\PermissionMiddleware;
use TrueAdmin\Kernel\Crud\CrudQueryRequest;
use TrueAdmin\Kernel\Http\ApiResponse;
use App\Module\Auth\Http\Admin\Middleware\AdminAuthMiddleware;
use App\Module\System\Dto\FileUploadContext;
use App\Module\System\Http\Admin\Request\FileCompleteRequest;
use App\Module\System\Http\Admin\Request\FilePresignRequest;
use App\Module\System\Http\Admin\Request\FileRemoteUrlRequest;
use App\Module\System\Service\FileService;
use Hyperf\HttpMessage\Upload\UploadedFile;
use Hyperf\HttpServer\Contract\RequestInterface;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\Actor;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Http\Attribute\AdminController as AdminRouteController;
use TrueAdmin\Kernel\Http\Attribute\AdminGet;
use TrueAdmin\Kernel\Http\Attribute\AdminPost;
use TrueAdmin\Kernel\Http\Attribute\Permission;
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

#[AdminRouteController(path: '/api/admin/files', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class AdminFileController extends AdminController
{
    public function __construct(private readonly FileService $files)
    {
    }

    #[AdminGet('')]
    #[Permission('system:file:list', title: '文件列表', group: '系统管理')]
    public function list(CrudQueryRequest $request): array
    {
        $actor = ActorContext::requirePrincipal();

        return ApiResponse::success($this->files->paginate($request->crudQuery(), $actor, $this->origin())->toArray());
    }

    #[AdminPost('upload')]
    #[Permission('system:file:upload', title: '上传文件', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'file.upload', remark: '上传文件')]
    public function upload(RequestInterface $request): array
    {
        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'file', 'reason' => 'required']);
        }

        $actor = ActorContext::requirePrincipal();
        $context = $this->context($actor, $request->input('category', 'attachment'), $request->input('visibility', 'public'));

        return ApiResponse::success($this->files->upload($file, $context, $this->origin()));
    }

    #[AdminPost('presign')]
    #[Permission('system:file:upload', title: '文件直传签名', group: '系统管理')]
    public function presign(FilePresignRequest $request): array
    {
        $input = $request->validated();
        $actor = ActorContext::requirePrincipal();
        $context = $this->context($actor, $input['category'], $input['visibility']);

        return ApiResponse::success($this->files->presign($input, $context, $this->origin()));
    }

    #[AdminPost('complete')]
    #[Permission('system:file:upload', title: '完成文件直传', group: '系统管理')]
    public function complete(FileCompleteRequest $request): array
    {
        return ApiResponse::success($this->files->complete($request->validated(), ActorContext::requirePrincipal(), $this->origin()));
    }

    #[AdminPost('remote-url')]
    #[Permission('system:file:upload', title: '远程文件转存', group: '系统管理')]
    #[OperationLog(module: 'system', action: 'file.remote-url', remark: '远程文件转存')]
    public function remoteUrl(FileRemoteUrlRequest $request): array
    {
        $input = $request->validated();
        $actor = ActorContext::requirePrincipal();
        $context = $this->context($actor, $input['category'], $input['visibility']);

        return ApiResponse::success($this->files->storeFromRemoteUrl($input['url'], $context, $this->origin(), $input['filename']));
    }

    #[AdminGet('{id}')]
    #[Permission('system:file:detail', title: '文件详情', group: '系统管理')]
    public function detail(int $id): array
    {
        return ApiResponse::success($this->files->detail($id, ActorContext::requirePrincipal(), $this->origin()));
    }

    private function context(Actor $actor, mixed $category, mixed $visibility): FileUploadContext
    {
        $category = trim((string) $category);
        $visibility = trim((string) $visibility);

        if ($category === '' || mb_strlen($category) > 64 || preg_match('/^[A-Za-z0-9_.-]+$/', $category) !== 1) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'category', 'reason' => 'invalid']);
        }
        if (! in_array($visibility, ['public', 'private'], true)) {
            throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['field' => 'visibility', 'reason' => 'invalid']);
        }

        return FileUploadContext::fromActor($actor, $category, $visibility);
    }

    private function origin(): ?string
    {
        $request = $this->request;
        $host = $request->header('X-Forwarded-Host', '') ?: $request->header('Host', '');
        if (! is_string($host) || trim($host) === '') {
            return null;
        }

        $scheme = $request->header('X-Forwarded-Proto', '') ?: $request->getUri()->getScheme();
        $scheme = is_string($scheme) && $scheme !== '' ? $scheme : 'http';

        return $scheme . '://' . trim(explode(',', $host)[0]);
    }
}
