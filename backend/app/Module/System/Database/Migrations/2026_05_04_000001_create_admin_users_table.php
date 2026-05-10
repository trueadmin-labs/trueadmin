<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_departments', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->string('code', 64)->unique();
            $table->string('name', 64);
            $table->integer('level')->default(1);
            $table->string('path', 255)->default('');
            $table->integer('sort')->default(0);
            $table->string('status', 32)->default('enabled');
            $table->datetimes();
        });

        Schema::create('admin_users', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('username', 64)->unique();
            $table->string('password');
            $table->string('nickname', 64)->default('');
            $table->string('status', 32)->default('enabled');
            $table->unsignedBigInteger('primary_dept_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->datetimes();
            $table->softDeletes();
        });

        Schema::create('admin_user_departments', function (Blueprint $table): void {
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('dept_id');
            $table->boolean('is_primary')->default(false);
            $table->primary(['user_id', 'dept_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_user_departments');
        Schema::dropIfExists('admin_users');
        Schema::dropIfExists('admin_departments');
    }
};
