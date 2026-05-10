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
use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('scope', 32)->default('admin');
            $table->string('owner_type', 32)->default('admin_user');
            $table->string('owner_id', 64)->default('');
            $table->unsignedBigInteger('owner_dept_id')->nullable();
            $table->string('category', 64)->default('attachment');
            $table->string('disk', 32)->default('local');
            $table->string('visibility', 32)->default('public');
            $table->string('name', 255);
            $table->string('extension', 32)->default('');
            $table->string('mime_type', 128)->default('application/octet-stream');
            $table->unsignedBigInteger('size')->default(0);
            $table->string('hash', 128)->default('');
            $table->string('path', 1024)->default('');
            $table->string('url', 1024)->default('');
            $table->string('status', 32)->default('pending');
            $table->json('metadata')->nullable();
            $table->datetimes();
            $table->softDeletes();

            $table->index(['scope', 'owner_type', 'owner_id']);
            $table->index(['category', 'status']);
            $table->index(['disk', 'path']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
