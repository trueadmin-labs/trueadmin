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
        Schema::create('admin_positions', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('dept_id');
            $table->string('code', 64);
            $table->string('name', 64);
            $table->string('type', 32)->default('normal');
            $table->boolean('is_leadership')->default(false);
            $table->string('description', 512)->default('');
            $table->integer('sort')->default(0);
            $table->string('status', 32)->default('enabled');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->datetimes();
            $table->unique(['dept_id', 'code']);
            $table->index(['dept_id', 'status']);
        });

        Schema::create('admin_user_positions', function (Blueprint $table): void {
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('position_id');
            $table->boolean('is_primary')->default(false);
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->primary(['user_id', 'position_id']);
            $table->index(['position_id']);
        });

        Schema::create('admin_position_roles', function (Blueprint $table): void {
            $table->unsignedBigInteger('position_id');
            $table->unsignedBigInteger('role_id');
            $table->integer('sort')->default(0);
            $table->datetimes();
            $table->primary(['position_id', 'role_id']);
            $table->index(['role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_position_roles');
        Schema::dropIfExists('admin_user_positions');
        Schema::dropIfExists('admin_positions');
    }
};
