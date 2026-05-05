<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_roles', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->string('code', 64)->unique();
            $table->string('name', 64);
            $table->integer('level')->default(1);
            $table->string('path', 255)->default('');
            $table->integer('sort')->default(0);
            $table->string('status', 32)->default('enabled');
            $table->timestamp('metadata_synced_at')->nullable();
            $table->datetimes();
        });

        Schema::create('admin_menus', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->string('code', 128)->default('');
            $table->string('type', 32)->default('menu');
            $table->string('name', 64);
            $table->string('path', 255)->default('');
            $table->string('component', 255)->default('');
            $table->string('icon', 64)->default('');
            $table->string('permission', 128)->default('');
            $table->integer('sort')->default(0);
            $table->string('status', 32)->default('enabled');
            $table->timestamp('metadata_synced_at')->nullable();
            $table->datetimes();
        });

        Schema::create('admin_role_user', function (Blueprint $table): void {
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('user_id');
            $table->primary(['role_id', 'user_id']);
        });

        Schema::create('admin_role_menu', function (Blueprint $table): void {
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('menu_id');
            $table->primary(['role_id', 'menu_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_role_menu');
        Schema::dropIfExists('admin_role_user');
        Schema::dropIfExists('admin_menus');
        Schema::dropIfExists('admin_roles');
    }
};
