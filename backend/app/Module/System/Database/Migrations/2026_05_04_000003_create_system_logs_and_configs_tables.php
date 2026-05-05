<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_operation_logs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('module', 64);
            $table->string('action', 64);
            $table->string('remark', 255)->default('');
            $table->string('principal_type', 32)->default('');
            $table->string('principal_id', 64)->default('');
            $table->string('operator_type', 32)->default('');
            $table->string('operator_id', 64)->default('');
            $table->unsignedBigInteger('operation_dept_id')->nullable();
            $table->json('context')->nullable();
            $table->datetimes();
        });

        Schema::create('admin_login_logs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('admin_user_id')->nullable();
            $table->string('username', 64)->default('');
            $table->string('ip', 64)->default('');
            $table->string('user_agent', 512)->default('');
            $table->string('status', 32)->default('success');
            $table->datetimes();
        });

        Schema::create('system_dicts', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('code', 64)->unique();
            $table->string('name', 64);
            $table->string('status', 32)->default('enabled');
            $table->datetimes();
        });

        Schema::create('system_configs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('key', 128)->unique();
            $table->text('value')->nullable();
            $table->string('remark', 255)->default('');
            $table->datetimes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_configs');
        Schema::dropIfExists('system_dicts');
        Schema::dropIfExists('admin_login_logs');
        Schema::dropIfExists('admin_operation_logs');
    }
};
